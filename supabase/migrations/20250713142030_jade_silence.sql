/*
  # Add company_id and post_type columns to posts table

  1. Changes
    - Add `company_id` column to link posts to companies
    - Add `post_type` column to distinguish between qudos and claims
    - Add foreign key constraint for company_id
    - Add check constraint for post_type values
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
    - No changes to existing permissions
*/

-- Add company_id column (nullable since not all posts are company-related)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE posts ADD COLUMN company_id uuid;
  END IF;
END $$;

-- Add post_type column (nullable with default null for regular posts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'post_type'
  ) THEN
    ALTER TABLE posts ADD COLUMN post_type text;
  END IF;
END $$;

-- Add foreign key constraint for company_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'posts_company_id_fkey'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add check constraint for post_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'posts_post_type_check'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_post_type_check 
    CHECK (post_type IS NULL OR post_type IN ('qudo', 'claim'));
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_company_id ON posts(company_id);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_company_post_type ON posts(company_id, post_type);