/*
  # Remove cover_image_url from companies table

  1. Changes
    - Remove the cover_image_url column from the companies table
    - Update existing data to set cover_image_url to null
*/

-- First, update any existing records to set cover_image_url to null
UPDATE companies
SET cover_image_url = NULL
WHERE cover_image_url IS NOT NULL;

-- Then remove the column
ALTER TABLE companies
DROP COLUMN IF EXISTS cover_image_url;