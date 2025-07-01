/*
  # Company Experience Voting System

  1. New Tables
    - `company_experience_votes`
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `user_id` (uuid, references user_profiles)
      - `vote_type` (text, 'happy' or 'angry')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `company_experience_votes` table
    - Add policies for authenticated users to vote
    - Add policies for public to view votes

  3. Features
    - Users can vote happy or angry for each company
    - Users can change their vote
    - Users can remove their vote
    - Track total votes per company
*/

-- Create company experience votes table
CREATE TABLE IF NOT EXISTS company_experience_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('happy', 'angry')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_experience_votes_company_id ON company_experience_votes(company_id);
CREATE INDEX IF NOT EXISTS idx_experience_votes_user_id ON company_experience_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_votes_company_user ON company_experience_votes(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_experience_votes_vote_type ON company_experience_votes(vote_type);

-- Enable RLS
ALTER TABLE company_experience_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view experience votes"
  ON company_experience_votes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create votes"
  ON company_experience_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON company_experience_votes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON company_experience_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_experience_votes_updated_at
  BEFORE UPDATE ON company_experience_votes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();