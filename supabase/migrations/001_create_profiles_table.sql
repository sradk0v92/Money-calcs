-- Create profiles table
-- Extends Supabase Auth users table with additional profile information
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles extending Supabase Auth with additional information';
COMMENT ON COLUMN profiles.id IS 'User ID from auth.users table';
COMMENT ON COLUMN profiles.full_name IS 'Full name of the user';
COMMENT ON COLUMN profiles.role IS 'User role: user or admin';
