/*
  # Add foreign key relationship between user_profiles and dating_profiles

  1. Changes
    - Add foreign key constraint from dating_profiles.id to user_profiles.id
    - Ensure referential integrity between the tables
    - Enable CASCADE delete to maintain data consistency

  2. Security
    - No changes to existing RLS policies
    - Maintains existing table permissions
*/

-- Add foreign key constraint to establish relationship between dating_profiles and user_profiles
ALTER TABLE dating_profiles
ADD CONSTRAINT fk_dating_profiles_user_profile
FOREIGN KEY (id) REFERENCES user_profiles(id)
ON DELETE CASCADE;