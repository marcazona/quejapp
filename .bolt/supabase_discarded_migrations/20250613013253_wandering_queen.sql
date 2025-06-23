/*
  # Fix dating profiles relationship

  1. Changes
    - Add foreign key constraint between dating_profiles and user_profiles tables
    - This allows Supabase to understand the relationship for join queries

  2. Security
    - No changes to existing RLS policies
    - Maintains existing data integrity
*/

-- Add foreign key constraint between dating_profiles and user_profiles
-- This assumes that dating_profiles.id should reference user_profiles.id
DO $$
BEGIN
  -- Check if the foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'dating_profiles_user_profiles_fkey' 
    AND table_name = 'dating_profiles'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE public.dating_profiles
    ADD CONSTRAINT dating_profiles_user_profiles_fkey
    FOREIGN KEY (id)
    REFERENCES public.user_profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;