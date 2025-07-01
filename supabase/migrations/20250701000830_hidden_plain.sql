/*
  # Fix Companies RLS Policies

  1. Security Updates
    - Update companies table RLS policies to allow creation
    - Add proper INSERT policy for authenticated users
    - Maintain security while allowing company creation

  2. Changes
    - Add INSERT policy for authenticated users to create companies
    - Update existing policies to be more permissive for company management
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON companies;

-- Create new policies that allow company creation
CREATE POLICY "Anyone can view companies"
  ON companies
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete companies"
  ON companies
  FOR DELETE
  TO authenticated
  USING (true);