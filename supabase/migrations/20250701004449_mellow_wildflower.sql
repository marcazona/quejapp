/*
  # LiveMood Vote Tracking System Implementation

  1. Company LiveMood Statistics
    - Ensure all companies have stats records
    - Reset vote counts to start fresh
    - Set proper trend directions

  2. Vote Management
    - Clear existing votes to start with accurate data
    - Ensure proper indexing for performance

  3. Functions and Triggers
    - Update trend calculation sensitivity
    - Ensure automatic stats updates on vote changes
*/

-- Ensure company_livemood_stats table exists with proper structure
CREATE TABLE IF NOT EXISTS company_livemood_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  total_votes integer DEFAULT 0,
  positive_votes integer DEFAULT 0,
  negative_votes integer DEFAULT 0,
  trend_direction text DEFAULT 'stable' CHECK (trend_direction IN ('up', 'down', 'stable')),
  last_calculated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id)
);

-- Ensure company_livemood_votes table exists with proper structure
CREATE TABLE IF NOT EXISTS company_livemood_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('positive', 'negative')),
  experience_category text DEFAULT 'general' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_livemood_stats_company_id ON company_livemood_stats(company_id);
CREATE INDEX IF NOT EXISTS idx_livemood_stats_trend ON company_livemood_stats(trend_direction);
CREATE INDEX IF NOT EXISTS idx_livemood_stats_last_calculated ON company_livemood_stats(last_calculated);
CREATE INDEX IF NOT EXISTS idx_livemood_votes_company_id ON company_livemood_votes(company_id);
CREATE INDEX IF NOT EXISTS idx_livemood_votes_user_id ON company_livemood_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_livemood_votes_company_user ON company_livemood_votes(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_livemood_votes_created_at ON company_livemood_votes(created_at);

-- Clear all existing votes to start fresh with accurate data
DELETE FROM company_livemood_votes;

-- Reset all company stats to start from zero
UPDATE company_livemood_stats 
SET 
  total_votes = 0,
  positive_votes = 0,
  negative_votes = 0,
  trend_direction = 'stable',
  last_calculated = now(),
  updated_at = now();

-- Ensure every company has a stats record
INSERT INTO company_livemood_stats (company_id, total_votes, positive_votes, negative_votes, trend_direction)
SELECT 
  id,
  0,
  0,
  0,
  'stable'
FROM companies 
WHERE id NOT IN (SELECT company_id FROM company_livemood_stats)
ON CONFLICT (company_id) DO NOTHING;

-- Create or replace the function to calculate trend direction with better sensitivity
CREATE OR REPLACE FUNCTION calculate_trend_direction(
  current_positive integer,
  current_total integer,
  previous_positive integer,
  previous_total integer
) RETURNS text AS $$
DECLARE
  current_percentage numeric;
  previous_percentage numeric;
  percentage_diff numeric;
BEGIN
  -- Handle edge cases
  IF current_total = 0 THEN
    RETURN 'stable';
  END IF;
  
  IF previous_total = 0 THEN
    IF current_positive > (current_total / 2) THEN
      RETURN 'up';
    ELSIF current_positive < (current_total / 2) THEN
      RETURN 'down';
    ELSE
      RETURN 'stable';
    END IF;
  END IF;
  
  -- Calculate percentages
  current_percentage := (current_positive::numeric / current_total::numeric) * 100;
  previous_percentage := (previous_positive::numeric / previous_total::numeric) * 100;
  percentage_diff := current_percentage - previous_percentage;
  
  -- More sensitive trend detection (1% threshold instead of 2%)
  IF percentage_diff > 1 THEN
    RETURN 'up';
  ELSIF percentage_diff < -1 THEN
    RETURN 'down';
  ELSE
    RETURN 'stable';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the function to update livemood stats
CREATE OR REPLACE FUNCTION update_company_livemood_stats(target_company_id uuid DEFAULT NULL)
RETURNS void AS $$
DECLARE
  company_record RECORD;
  current_stats RECORD;
  new_trend text;
BEGIN
  -- If target_company_id is provided, update only that company
  -- Otherwise, update all companies
  FOR company_record IN 
    SELECT id FROM companies 
    WHERE (target_company_id IS NULL OR id = target_company_id)
  LOOP
    -- Get current stats before update
    SELECT total_votes, positive_votes INTO current_stats
    FROM company_livemood_stats 
    WHERE company_id = company_record.id;
    
    -- Calculate new stats from votes
    WITH vote_counts AS (
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE vote_type = 'positive') as positive,
        COUNT(*) FILTER (WHERE vote_type = 'negative') as negative
      FROM company_livemood_votes 
      WHERE company_id = company_record.id
    )
    UPDATE company_livemood_stats 
    SET 
      total_votes = vote_counts.total,
      positive_votes = vote_counts.positive,
      negative_votes = vote_counts.negative,
      last_calculated = now(),
      updated_at = now()
    FROM vote_counts
    WHERE company_id = company_record.id;
    
    -- Calculate trend direction
    WITH updated_stats AS (
      SELECT total_votes, positive_votes 
      FROM company_livemood_stats 
      WHERE company_id = company_record.id
    )
    SELECT calculate_trend_direction(
      updated_stats.positive_votes,
      updated_stats.total_votes,
      COALESCE(current_stats.positive_votes, 0),
      COALESCE(current_stats.total_votes, 0)
    ) INTO new_trend
    FROM updated_stats;
    
    -- Update trend direction
    UPDATE company_livemood_stats 
    SET 
      trend_direction = new_trend,
      updated_at = now()
    WHERE company_id = company_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger function for automatic stats updates
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

-- Create trigger for automatic stats updates
DROP TRIGGER IF EXISTS livemood_stats_update_trigger ON company_livemood_votes;
CREATE TRIGGER livemood_stats_update_trigger
  AFTER INSERT OR UPDATE OR DELETE ON company_livemood_votes
  FOR EACH ROW EXECUTE FUNCTION trigger_update_livemood_stats();

-- Create updated_at trigger for company_livemood_stats
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_livemood_stats_updated_at ON company_livemood_stats;
CREATE TRIGGER handle_livemood_stats_updated_at
  BEFORE UPDATE ON company_livemood_stats
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_livemood_votes_updated_at ON company_livemood_votes;
CREATE TRIGGER handle_livemood_votes_updated_at
  BEFORE UPDATE ON company_livemood_votes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Verify the setup by running initial stats calculation
SELECT update_company_livemood_stats();