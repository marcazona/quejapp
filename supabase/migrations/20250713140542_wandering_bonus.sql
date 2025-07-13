/*
  # Create LiveMood tables for company experience tracking

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
      - `trend_direction` (text, 'up', 'down', or 'stable')
      - `last_calculated` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read and manage votes
    - Add policies for viewing stats

  3. Indexes
    - Add indexes for performance on frequently queried columns
    - Add unique constraint on company_id, user_id for votes table
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
  UNIQUE(company_id, user_id)
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

CREATE POLICY "Service role can manage stats"
  ON company_livemood_stats
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_livemood_votes_company_id ON company_livemood_votes(company_id);
CREATE INDEX IF NOT EXISTS idx_livemood_votes_user_id ON company_livemood_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_livemood_votes_created_at ON company_livemood_votes(created_at);
CREATE INDEX IF NOT EXISTS idx_livemood_votes_vote_type ON company_livemood_votes(vote_type);
CREATE INDEX IF NOT EXISTS idx_livemood_votes_experience_category ON company_livemood_votes(experience_category);

CREATE INDEX IF NOT EXISTS idx_livemood_stats_company_id ON company_livemood_stats(company_id);
CREATE INDEX IF NOT EXISTS idx_livemood_stats_trend_direction ON company_livemood_stats(trend_direction);
CREATE INDEX IF NOT EXISTS idx_livemood_stats_last_calculated ON company_livemood_stats(last_calculated);

-- Create triggers for updated_at
CREATE TRIGGER handle_livemood_votes_updated_at
  BEFORE UPDATE ON company_livemood_votes
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_livemood_stats_updated_at
  BEFORE UPDATE ON company_livemood_stats
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Function to update stats when votes change
CREATE OR REPLACE FUNCTION update_company_livemood_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stats for the affected company
  INSERT INTO company_livemood_stats (company_id, total_votes, positive_votes, negative_votes, last_calculated)
  SELECT 
    company_id,
    COUNT(*) as total_votes,
    COUNT(*) FILTER (WHERE vote_type = 'positive') as positive_votes,
    COUNT(*) FILTER (WHERE vote_type = 'negative') as negative_votes,
    now() as last_calculated
  FROM company_livemood_votes 
  WHERE company_id = COALESCE(NEW.company_id, OLD.company_id)
  GROUP BY company_id
  ON CONFLICT (company_id) 
  DO UPDATE SET
    total_votes = EXCLUDED.total_votes,
    positive_votes = EXCLUDED.positive_votes,
    negative_votes = EXCLUDED.negative_votes,
    last_calculated = EXCLUDED.last_calculated,
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update stats
CREATE TRIGGER update_livemood_stats_on_insert
  AFTER INSERT ON company_livemood_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_company_livemood_stats();

CREATE TRIGGER update_livemood_stats_on_update
  AFTER UPDATE ON company_livemood_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_company_livemood_stats();

CREATE TRIGGER update_livemood_stats_on_delete
  AFTER DELETE ON company_livemood_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_company_livemood_stats();