/*
  # Create posts table with company relationship

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `company_id` (uuid, foreign key to companies)
      - `content` (text)
      - `photo_url` (text, nullable)
      - `post_type` (text, enum: 'qudo', 'claim')
      - `likes_count` (integer)
      - `comments_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `posts` table
    - Add policies for authenticated users to create, read, update, and delete their own posts
*/

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  content text NOT NULL,
  photo_url text,
  post_type text NOT NULL CHECK (post_type IN ('qudo', 'claim')),
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_company_id ON posts(company_id);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

-- Enable row level security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Posts are viewable by authenticated users"
  ON posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER handle_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create functions to increment company stats
CREATE OR REPLACE FUNCTION increment_company_reviews(company_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE companies
  SET total_reviews = total_reviews + 1
  WHERE id = company_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_company_claims(company_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE companies
  SET total_claims = total_claims + 1
  WHERE id = company_id;
END;
$$ LANGUAGE plpgsql;