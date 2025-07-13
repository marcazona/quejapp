/*
  # Add Post Comments System

  1. New Tables
    - `post_comment_likes` - Stores likes on comments
      - `id` (uuid, primary key)
      - `comment_id` (uuid, foreign key to post_comments)
      - `user_id` (uuid, foreign key to user_profiles)
      - `created_at` (timestamp)
  2. Changes
    - Add likes_count column to post_comments table
  3. Security
    - Enable RLS on new tables
    - Add policies for comment likes
*/

-- Add likes_count column to post_comments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'post_comments' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE post_comments ADD COLUMN likes_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create post_comment_likes table
CREATE TABLE IF NOT EXISTS post_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_post_comment_likes_comment_id ON post_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comment_likes_user_id ON post_comment_likes(user_id);

-- Enable RLS on post_comment_likes
ALTER TABLE post_comment_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for post_comment_likes
CREATE POLICY "Users can view all comment likes" 
  ON post_comment_likes 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can like comments" 
  ON post_comment_likes 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments" 
  ON post_comment_likes 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post_comments
    SET likes_count = likes_count - 1
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update likes count
DROP TRIGGER IF EXISTS update_comment_likes_count_trigger ON post_comment_likes;
CREATE TRIGGER update_comment_likes_count_trigger
AFTER INSERT OR DELETE ON post_comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_comment_likes_count();