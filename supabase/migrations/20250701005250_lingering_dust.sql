/*
  # Remove LiveMood System
  
  1. Changes
     - Drop company_livemood_votes table
     - Drop company_livemood_stats table
     - Drop related functions and triggers
  
  2. Reason
     - Simplifying application by removing the LiveMood feature
*/

-- Drop related functions and triggers first
DROP FUNCTION IF EXISTS trigger_update_livemood_stats() CASCADE;
DROP FUNCTION IF EXISTS update_company_livemood_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS calculate_trend_direction(integer, integer, integer, integer) CASCADE;

-- Drop tables
DROP TABLE IF EXISTS company_livemood_votes;
DROP TABLE IF EXISTS company_livemood_stats;