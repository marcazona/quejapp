/*
  # Dating App User Profiles Schema

  1. New Tables
    - `dating_profiles` - Extended dating profile information
    - `user_photos` - Multiple photos per user
    - `user_posts` - User posts/stories
    - `user_locations` - User location data for proximity matching

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create dating_profiles table for extended profile info
CREATE TABLE IF NOT EXISTS dating_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bio text,
  age integer,
  height integer, -- in cm
  weight integer, -- in kg
  body_type text,
  ethnicity text,
  relationship_status text,
  looking_for text[],
  interests text[],
  occupation text,
  education text,
  languages text[],
  is_online boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  is_verified boolean DEFAULT false,
  show_distance boolean DEFAULT true,
  show_age boolean DEFAULT true,
  max_distance integer DEFAULT 50, -- in km
  age_range_min integer DEFAULT 18,
  age_range_max integer DEFAULT 99,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_photos table
CREATE TABLE IF NOT EXISTS user_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  is_primary boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create user_posts table
CREATE TABLE IF NOT EXISTS user_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  photo_url text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_locations table for proximity
CREATE TABLE IF NOT EXISTS user_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  city text,
  country text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE dating_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Dating profiles policies
CREATE POLICY "Users can read all dating profiles"
  ON dating_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own dating profile"
  ON dating_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own dating profile"
  ON dating_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User photos policies
CREATE POLICY "Users can read all photos"
  ON user_photos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own photos"
  ON user_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos"
  ON user_photos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos"
  ON user_photos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User posts policies
CREATE POLICY "Users can read all posts"
  ON user_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own posts"
  ON user_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON user_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON user_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User locations policies
CREATE POLICY "Users can read all locations"
  ON user_locations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own location"
  ON user_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location"
  ON user_locations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_photos_user_id ON user_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_photos_primary ON user_photos(user_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_user_posts_user_id ON user_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_dating_profiles_online ON dating_profiles(is_online);

-- Create function to update updated_at for dating_profiles
CREATE OR REPLACE FUNCTION update_dating_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for dating_profiles
CREATE TRIGGER update_dating_profiles_updated_at
  BEFORE UPDATE ON dating_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_dating_profiles_updated_at();

-- Create function to update updated_at for user_posts
CREATE OR REPLACE FUNCTION update_user_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_posts
CREATE TRIGGER update_user_posts_updated_at
  BEFORE UPDATE ON user_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_posts_updated_at();