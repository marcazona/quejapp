/*
  # Update sample companies to remove cover_image_url

  1. Changes
    - Update existing sample companies to remove cover_image_url references
*/

-- Update sample companies to remove cover_image_url references
UPDATE companies
SET cover_image_url = NULL
WHERE name IN (
  'TechCorp Solutions',
  'GreenEarth Foods',
  'Urban Fashion Co.',
  'HealthFirst Clinic',
  'EcoClean Services',
  'AutoFix Garage'
);