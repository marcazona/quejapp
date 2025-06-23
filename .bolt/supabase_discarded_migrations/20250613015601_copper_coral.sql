/*
  # Auto-create dating profile when user profile is created

  1. New Functions
    - `create_dating_profile_for_new_user()` - Function to automatically create a dating profile
    
  2. New Triggers
    - Trigger to call the function when a new user profile is inserted
    
  3. Security
    - Function runs with security definer to ensure it has proper permissions
*/

-- Create function to automatically create dating profile for new users
CREATE OR REPLACE FUNCTION create_dating_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a basic dating profile for the new user
  INSERT INTO public.dating_profiles (
    id,
    is_online,
    is_verified,
    show_distance,
    show_age,
    max_distance,
    age_range_min,
    age_range_max
  ) VALUES (
    NEW.id,
    false,
    false,
    true,
    true,
    50,
    18,
    99
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create dating profile when user profile is created
CREATE TRIGGER create_dating_profile_trigger
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_dating_profile_for_new_user();