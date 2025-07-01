/*
  # Fix Companies Table RLS Policy

  1. Security Updates
    - Update RLS policies for companies table to properly handle admin operations
    - Ensure authenticated users can create, read, update, and delete companies
    - Add proper policy conditions for admin access

  2. Changes
    - Drop existing restrictive policies
    - Create new policies that allow full access for authenticated users
    - Ensure policies work correctly with the admin dashboard context
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can view companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON companies;

-- Create new policies that properly handle authenticated users
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

-- Ensure RLS is enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;