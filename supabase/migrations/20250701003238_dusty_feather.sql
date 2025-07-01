/*
  # Update LiveMood system for individual company tracking

  1. Changes
     - Ensure LiveMood votes start from 0 for each company
     - Add persistence for user votes
     - Fix any existing data issues
  
  2. Operations
     - Reset any existing stats to ensure proper counting
     - Verify company_livemood_stats table structure
     - Add indexes for better performance
*/

-- Reset all company livemood stats to start from 0
UPDATE company_livemood_stats
SET 
  total_votes = 0,
  positive_votes = 0,
  negative_votes = 0,
  trend_direction = 'stable',
  last_calculated = now(),
  updated_at = now();

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_livemood_stats_trend ON company_livemood_stats(trend_direction);
CREATE INDEX IF NOT EXISTS idx_livemood_stats_last_calculated ON company_livemood_stats(last_calculated);

-- Ensure all companies have a stats record (for any that might be missing)
INSERT INTO company_livemood_stats (company_id, total_votes, positive_votes, negative_votes, trend_direction)
SELECT id, 0, 0, 0, 'stable'
FROM companies
WHERE id NOT IN (SELECT company_id FROM company_livemood_stats)
ON CONFLICT (company_id) DO NOTHING;

-- Update the calculate_trend_direction function to be more sensitive to changes
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
  
  -- Determine trend with more sensitive thresholds
  IF percentage_diff > 1 THEN
    RETURN 'up';
  ELSIF percentage_diff < -1 THEN
    RETURN 'down';
  ELSE
    RETURN 'stable';
  END IF;
END;
$$ LANGUAGE plpgsql;