/*
  # Fix company insertion migration

  This migration inserts sample companies into the database.
  
  The previous version used ON CONFLICT (name) DO NOTHING, but there is no unique constraint
  on the name column, causing the error:
  "there is no unique or exclusion constraint matching the ON CONFLICT specification"
  
  This version uses a WHERE NOT EXISTS clause to avoid duplicates instead.
*/

-- Insert sample companies for testing
-- Use WHERE NOT EXISTS to avoid duplicates instead of ON CONFLICT

INSERT INTO companies (
  name, 
  description, 
  logo_url, 
  cover_image_url, 
  industry, 
  website, 
  phone, 
  email, 
  address, 
  city, 
  country, 
  rating, 
  total_reviews, 
  total_claims, 
  verified, 
  is_active
)
SELECT * FROM (VALUES
  (
    'TechCorp Solutions',
    'Leading technology solutions provider specializing in cloud computing and digital transformation.',
    'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
    'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
    'Technology',
    'https://techcorp.com',
    '+1-555-0123',
    'contact@techcorp.com',
    '123 Tech Street',
    'San Francisco',
    'USA',
    4.2,
    156,
    23,
    true,
    true
  ),
  (
    'GreenEarth Foods',
    'Organic and sustainable food products for a healthier planet and lifestyle.',
    'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
    'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
    'Food & Beverage',
    'https://greenearthfoods.com',
    '+1-555-0456',
    'hello@greenearthfoods.com',
    '456 Green Avenue',
    'Portland',
    'USA',
    4.7,
    89,
    12,
    true,
    true
  ),
  (
    'Urban Fashion Co.',
    'Trendy and affordable fashion for the modern urban lifestyle.',
    'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
    'https://images.pexels.com/photos/1040946/pexels-photo-1040946.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
    'Fashion & Retail',
    'https://urbanfashion.com',
    '+1-555-0789',
    'style@urbanfashion.com',
    '789 Fashion Boulevard',
    'New York',
    'USA',
    3.9,
    234,
    45,
    false,
    true
  ),
  (
    'HealthFirst Clinic',
    'Comprehensive healthcare services with a focus on preventive medicine.',
    'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
    'https://images.pexels.com/photos/263401/pexels-photo-263401.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
    'Healthcare',
    'https://healthfirst.com',
    '+1-555-0321',
    'care@healthfirst.com',
    '321 Health Plaza',
    'Chicago',
    'USA',
    4.5,
    67,
    8,
    true,
    true
  ),
  (
    'EcoClean Services',
    'Environmentally friendly cleaning services for homes and businesses.',
    'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
    'https://images.pexels.com/photos/4239092/pexels-photo-4239092.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
    'Services',
    'https://ecoclean.com',
    '+1-555-0654',
    'info@ecoclean.com',
    '654 Clean Street',
    'Seattle',
    'USA',
    4.3,
    123,
    19,
    true,
    true
  ),
  (
    'AutoFix Garage',
    'Professional automotive repair and maintenance services you can trust.',
    'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
    'https://images.pexels.com/photos/3806289/pexels-photo-3806289.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
    'Automotive',
    'https://autofix.com',
    '+1-555-0987',
    'service@autofix.com',
    '987 Motor Way',
    'Detroit',
    'USA',
    4.1,
    178,
    34,
    false,
    true
  )
) AS new_companies(name, description, logo_url, cover_image_url, industry, website, phone, email, address, city, country, rating, total_reviews, total_claims, verified, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM companies WHERE companies.name = new_companies.name
);