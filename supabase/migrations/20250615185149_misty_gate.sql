/*
  # Create missing database tables for quejapp

  1. New Tables
    - `companies` - Store company information
    - `company_reviews` - Store positive reviews (Qdles)
    - `company_claims` - Store customer claims
    - `dating_profiles` - Store dating profile information
    - `user_photos` - Store user photos
    - `user_locations` - Store user location data
    - `posts` - Store user posts

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table

  3. Functions
    - Add trigger function for updated_at timestamps
*/

-- Create trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_url text,
  cover_image_url text,
  industry text NOT NULL,
  website text,
  phone text,
  email text,
  address text,
  city text,
  country text,
  rating numeric(3,2),
  total_reviews integer DEFAULT 0,
  total_claims integer DEFAULT 0,
  verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies are viewable by everyone"
  ON companies
  FOR SELECT
  TO public
  USING (true);

CREATE TRIGGER handle_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Company reviews (Qdles) table
CREATE TABLE IF NOT EXISTS company_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  is_verified_purchase boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON company_reviews
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create reviews"
  ON company_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON company_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER handle_company_reviews_updated_at
  BEFORE UPDATE ON company_reviews
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Company claims table
CREATE TABLE IF NOT EXISTS company_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category text NOT NULL,
  resolution_notes text,
  coins_awarded integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Claims are viewable by everyone"
  ON company_claims
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create claims"
  ON company_claims
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own claims"
  ON company_claims
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER handle_company_claims_updated_at
  BEFORE UPDATE ON company_claims
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Dating profiles table
CREATE TABLE IF NOT EXISTS dating_profiles (
  id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  bio text,
  height integer,
  body_type text,
  ethnicity text,
  interests text[] DEFAULT '{}',
  looking_for text[] DEFAULT '{}',
  occupation text,
  education text,
  is_online boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  show_distance boolean DEFAULT true,
  show_age boolean DEFAULT true,
  max_distance integer DEFAULT 50,
  age_range_min integer DEFAULT 18,
  age_range_max integer DEFAULT 99,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dating_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dating profiles are viewable by authenticated users"
  ON dating_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own dating profile"
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

CREATE TRIGGER handle_dating_profiles_updated_at
  BEFORE UPDATE ON dating_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- User photos table
CREATE TABLE IF NOT EXISTS user_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  is_primary boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User photos are viewable by authenticated users"
  ON user_photos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own photos"
  ON user_photos
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER handle_user_photos_updated_at
  BEFORE UPDATE ON user_photos
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- User locations table
CREATE TABLE IF NOT EXISTS user_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  latitude numeric(10,8),
  longitude numeric(11,8),
  city text,
  country text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User locations are viewable by authenticated users"
  ON user_locations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own location"
  ON user_locations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER handle_user_locations_updated_at
  BEFORE UPDATE ON user_locations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  photo_url text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER handle_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert sample companies
INSERT INTO companies (name, description, industry, logo_url, website, phone, email, rating, total_reviews, total_claims, verified) VALUES
('TechCorp Solutions', 'Leading technology solutions provider specializing in cloud computing and digital transformation.', 'Technology', 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200', 'https://techcorp.com', '+1-555-0123', 'contact@techcorp.com', 4.2, 156, 23, true),
('GreenEarth Foods', 'Organic and sustainable food products for a healthier planet and lifestyle.', 'Food & Beverage', 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200&h=200', 'https://greenearthfoods.com', '+1-555-0456', 'hello@greenearthfoods.com', 4.7, 89, 12, true),
('Urban Fashion Co.', 'Trendy and affordable fashion for the modern urban lifestyle.', 'Fashion & Retail', 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=200&h=200', 'https://urbanfashion.com', '+1-555-0789', 'style@urbanfashion.com', 3.9, 234, 45, false),
('HealthFirst Clinic', 'Comprehensive healthcare services with a focus on preventive medicine.', 'Healthcare', 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=200&h=200', 'https://healthfirst.com', '+1-555-0321', 'care@healthfirst.com', 4.5, 67, 8, true),
('EcoClean Services', 'Environmentally friendly cleaning services for homes and businesses.', 'Services', 'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=200&h=200', 'https://ecoclean.com', '+1-555-0654', 'info@ecoclean.com', 4.3, 123, 19, true),
('AutoFix Garage', 'Professional automotive repair and maintenance services you can trust.', 'Automotive', 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=200&h=200', 'https://autofix.com', '+1-555-0987', 'service@autofix.com', 4.1, 178, 34, false)
ON CONFLICT DO NOTHING;