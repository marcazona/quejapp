/*
  # Add Post Comments System

  1. New Tables
    - `post_comment_likes` - Stores likes on comments
      - `id` (uuid, primary key)
      - `comment_id` (uuid, foreign key to post_comments)
      - `user_id` (uuid, foreign key to user_profiles)
      - `created_at` (timestamp)

  2. Changes
    - Add `likes_count` column to `post_comments` table

  3. Security
    - Enable RLS on new tables
    - Add policies for comment likes
*/

-- Add likes_count to post_comments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'post_comments' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE post_comments ADD COLUMN likes_count integer DEFAULT 0;
  END IF;
END $$;

-- Create post_comment_likes table
CREATE TABLE IF NOT EXISTS post_comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_comment_likes_comment_id ON post_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comment_likes_user_id ON post_comment_likes(user_id);

-- Enable RLS
ALTER TABLE post_comment_likes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can like comments" 
  ON post_comment_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can unlike comments" 
  ON post_comment_likes
  FOR DELETE
  TO authenticated
  USING (uid() = user_id);

CREATE POLICY "Anyone can view comment likes" 
  ON post_comment_likes
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to update comment likes count
CREATE OR REPLACE FUNCTION handle_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE post_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE post_comments
    SET likes_count = likes_count - 1
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER comment_like_count_trigger
AFTER INSERT OR DELETE ON post_comment_likes
FOR EACH ROW
EXECUTE FUNCTION handle_comment_like_count();