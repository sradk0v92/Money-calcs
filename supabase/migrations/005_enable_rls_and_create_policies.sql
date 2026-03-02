-- Enable Row Level Security (RLS) and create policies
-- This ensures that users can only access their own data

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculator_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Allow users to view all profiles (for finding other users/info)
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- CALCULATOR_TYPES TABLE POLICIES
-- ============================================================================

-- Allow everyone to view active calculator types
CREATE POLICY "Everyone can view active calculator types"
  ON calculator_types FOR SELECT
  USING (is_active = true);

-- Only admins can insert calculator types
CREATE POLICY "Only admins can create calculator types"
  ON calculator_types FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Only admins can update calculator types
CREATE POLICY "Only admins can update calculator types"
  ON calculator_types FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Only admins can delete calculator types
CREATE POLICY "Only admins can delete calculator types"
  ON calculator_types FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================================
-- CALCULATIONS TABLE POLICIES
-- ============================================================================

-- Users can view only their own calculations, admins can view all
CREATE POLICY "Users can view their own calculations"
  ON calculations FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users can create calculations
CREATE POLICY "Users can create calculations"
  ON calculations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can delete only their own calculations, admins can delete all
CREATE POLICY "Users can delete their own calculations"
  ON calculations FOR DELETE
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================================
-- SCENARIOS TABLE POLICIES
-- ============================================================================

-- Users can view only their own scenarios, admins can view all
CREATE POLICY "Users can view their own scenarios"
  ON scenarios FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users can create scenarios
CREATE POLICY "Users can create scenarios"
  ON scenarios FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update only their own scenarios, admins can update all
CREATE POLICY "Users can update their own scenarios"
  ON scenarios FOR UPDATE
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (user_id = auth.uid());

-- Users can delete only their own scenarios, admins can delete all
CREATE POLICY "Users can delete their own scenarios"
  ON scenarios FOR DELETE
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
