/*
  # LiveMood Tracking System

  1. Database Structure
    - Verifies company_livemood_stats table exists
    - Resets all stats to start from 0
    - Sets all trend directions to 'stable'
    - Ensures every company has a stats record
    - Clears existing votes to start fresh

  2. Performance Enhancements
    - Adds indexes for trend and last_calculated fields
    - Updates trend calculation to be more responsive (1% threshold)

  3. Security
    - Maintains existing RLS policies
*/

-- Verify that the company_livemood_stats table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_livemood_stats') THEN
    RAISE EXCEPTION 'company_livemood_stats table does not exist';
  END IF;
END $$;

-- Reset all company livemood stats to start from 0
UPDATE company_livemood_stats
SET 
  total_votes = 0,
  positive_votes = 0,
  negative_votes = 0,
  trend_direction = 'stable',
  last_calculated = now(),
  updated_at = now();

-- Ensure all companies have a stats record
INSERT INTO company_livemood_stats (company_id, total_votes, positive_votes, negative_votes, trend_direction)
SELECT id, 0, 0, 0, 'stable'
FROM companies
WHERE id NOT IN (SELECT company_id FROM company_livemood_stats)
ON CONFLICT (company_id) DO NOTHING;

-- Delete all existing votes to start fresh
TRUNCATE TABLE company_livemood_votes;

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_livemood_stats_trend ON company_livemood_stats(trend_direction);
CREATE INDEX IF NOT EXISTS idx_livemood_stats_last_calculated ON company_livemood_stats(last_calculated);

-- Update the calculate_trend_direction function to be more responsive
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
  
  -- Determine trend with more sensitive thresholds (1% change instead of 2%)
  IF percentage_diff > 1 THEN
    RETURN 'up';
  ELSIF percentage_diff < -1 THEN
    RETURN 'down';
  ELSE
    RETURN 'stable';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger function is properly updated
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

-- Verify trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'livemood_stats_update_trigger'
  ) THEN
    -- Create trigger if it doesn't exist
    CREATE TRIGGER livemood_stats_update_trigger
      AFTER INSERT OR UPDATE OR DELETE ON company_livemood_votes
      FOR EACH ROW EXECUTE FUNCTION trigger_update_livemood_stats();
  END IF;
END $$;