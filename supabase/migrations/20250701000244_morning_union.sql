/*
  # Add INSERT policy for companies table

  1. Security Changes
    - Add policy to allow authenticated users to insert companies
    - This enables admin users to create new companies through the dashboard

  The policy allows any authenticated user to insert companies. In a production environment,
  you might want to restrict this further to only admin users by checking user roles.
*/

-- Add policy to allow authenticated users to insert companies
CREATE POLICY "Authenticated users can create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);