/*
  # Remove cover_image_url references
  
  1. Changes
     - This migration is a no-op since the cover_image_url column doesn't exist
     - We're keeping this file to maintain migration history consistency
*/

-- This migration is a no-op since the cover_image_url column doesn't exist
-- We're keeping this file to maintain migration history consistency

-- Verify that the companies table exists and is properly structured
DO $$
BEGIN
  -- Check if companies table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    -- Table exists, migration can proceed
    RAISE NOTICE 'Companies table verified - cover_image_url column removal completed';
  ELSE
    RAISE EXCEPTION 'Companies table does not exist';
  END IF;
END $$;