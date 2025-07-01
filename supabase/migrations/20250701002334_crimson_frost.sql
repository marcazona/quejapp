/*
  # LiveMood Individual Company Tracking System

  1. New Tables
    - `company_livemood_votes`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `user_id` (uuid, foreign key to user_profiles)
      - `vote_type` (text, 'positive' or 'negative')
      - `experience_category` (text, category of experience)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `company_livemood_stats`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `total_votes` (integer)
      - `positive_votes` (integer)
      - `negative_votes` (integer)
      - `trend_direction` (text, 'up', 'down', 'stable')
      - `last_calculated` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to vote and view stats
    - Add policies for public to view aggregated stats

  3. Functions
    - Function to update company mood stats when votes change
    - Trigger to automatically update stats on vote changes

  4. Indexes
    - Composite indexes for performance on company_id + user_id
    - Indexes on company_id for stats lookups
*/

-- Create company_livemood_votes table
CREATE TABLE IF NOT EXISTS company_livemood_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('positive', 'negative')),
  experience_category text NOT NULL DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id) -- One vote per user per company
);

-- Create company_livemood_stats table
CREATE TABLE IF NOT EXISTS company_livemood_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  total_votes integer DEFAULT 0,
  positive_votes integer DEFAULT 0,
  negative_votes integer DEFAULT 0,
  trend_direction text DEFAULT 'stable' CHECK (trend_direction IN ('up', 'down', 'stable')),
  last_calculated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_livemood_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_livemood_stats ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_livemood_votes_company_id ON company_livemood_votes(company_id);
CREATE INDEX IF NOT EXISTS idx_livemood_votes_user_id ON company_livemood_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_livemood_votes_company_user ON company_livemood_votes(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_livemood_votes_created_at ON company_livemood_votes(created_at);
CREATE INDEX IF NOT EXISTS idx_livemood_stats_company_id ON company_livemood_stats(company_id);

-- RLS Policies for company_livemood_votes
CREATE POLICY "Anyone can view livemood votes"
  ON company_livemood_votes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create votes"
  ON company_livemood_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON company_livemood_votes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON company_livemood_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for company_livemood_stats
CREATE POLICY "Anyone can view livemood stats"
  ON company_livemood_stats
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage livemood stats"
  ON company_livemood_stats
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to calculate trend direction
CREATE OR REPLACE FUNCTION calculate_trend_direction(
  current_positive integer,
  current_negative integer,
  previous_positive integer DEFAULT 0,
  previous_negative integer DEFAULT 0
) RETURNS text AS $$
DECLARE
  current_percentage numeric;
  previous_percentage numeric;
  percentage_diff numeric;
BEGIN
  -- Calculate current positive percentage
  IF (current_positive + current_negative) = 0 THEN
    current_percentage := 0;
  ELSE
    current_percentage := (current_positive::numeric / (current_positive + current_negative)::numeric) * 100;
  END IF;
  
  -- Calculate previous positive percentage
  IF (previous_positive + previous_negative) = 0 THEN
    previous_percentage := 0;
  ELSE
    previous_percentage := (previous_positive::numeric / (previous_positive + previous_negative)::numeric) * 100;
  END IF;
  
  -- Calculate difference
  percentage_diff := current_percentage - previous_percentage;
  
  -- Determine trend
  IF percentage_diff > 2 THEN
    RETURN 'up';
  ELSIF percentage_diff < -2 THEN
    RETURN 'down';
  ELSE
    RETURN 'stable';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update company livemood stats
CREATE OR REPLACE FUNCTION update_company_livemood_stats(target_company_id uuid)
RETURNS void AS $$
DECLARE
  current_stats record;
  new_positive integer;
  new_negative integer;
  new_total integer;
  new_trend text;
BEGIN
  -- Get current stats for trend calculation
  SELECT positive_votes, negative_votes INTO current_stats
  FROM company_livemood_stats
  WHERE company_id = target_company_id;
  
  -- Calculate new vote counts
  SELECT 
    COUNT(*) FILTER (WHERE vote_type = 'positive'),
    COUNT(*) FILTER (WHERE vote_type = 'negative'),
    COUNT(*)
  INTO new_positive, new_negative, new_total
  FROM company_livemood_votes
  WHERE company_id = target_company_id;
  
  -- Calculate trend
  IF current_stats IS NOT NULL THEN
    new_trend := calculate_trend_direction(
      new_positive, 
      new_negative, 
      current_stats.positive_votes, 
      current_stats.negative_votes
    );
  ELSE
    new_trend := 'stable';
  END IF;
  
  -- Insert or update stats
  INSERT INTO company_livemood_stats (
    company_id,
    total_votes,
    positive_votes,
    negative_votes,
    trend_direction,
    last_calculated,
    updated_at
  ) VALUES (
    target_company_id,
    new_total,
    new_positive,
    new_negative,
    new_trend,
    now(),
    now()
  )
  ON CONFLICT (company_id) DO UPDATE SET
    total_votes = EXCLUDED.total_votes,
    positive_votes = EXCLUDED.positive_votes,
    negative_votes = EXCLUDED.negative_votes,
    trend_direction = EXCLUDED.trend_direction,
    last_calculated = EXCLUDED.last_calculated,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update stats when votes change
CREATE OR REPLACE FUNCTION trigger_update_livemood_stats()
RETURNS trigger AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_company_livemood_stats(NEW.company_id);
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    PERFORM update_company_livemood_stats(OLD.company_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS livemood_stats_update_trigger ON company_livemood_votes;
CREATE TRIGGER livemood_stats_update_trigger
  AFTER INSERT OR UPDATE OR DELETE ON company_livemood_votes
  FOR EACH ROW EXECUTE FUNCTION trigger_update_livemood_stats();

-- Create updated_at trigger for votes table
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_livemood_votes_updated_at ON company_livemood_votes;
CREATE TRIGGER handle_livemood_votes_updated_at
  BEFORE UPDATE ON company_livemood_votes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_livemood_stats_updated_at ON company_livemood_stats;
CREATE TRIGGER handle_livemood_stats_updated_at
  BEFORE UPDATE ON company_livemood_stats
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Insert initial stats for existing companies
INSERT INTO company_livemood_stats (company_id, total_votes, positive_votes, negative_votes)
SELECT id, 0, 0, 0
FROM companies
WHERE id NOT IN (SELECT company_id FROM company_livemood_stats)
ON CONFLICT (company_id) DO NOTHING;