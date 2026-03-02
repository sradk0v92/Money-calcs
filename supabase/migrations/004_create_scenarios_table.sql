-- Create scenarios table
-- Stores user-saved calculation scenarios for later reference and comparison
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calculator_type_id UUID NOT NULL REFERENCES calculator_types(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  inputs JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX idx_scenarios_calculator_type_id ON scenarios(calculator_type_id);
CREATE INDEX idx_scenarios_created_at ON scenarios(created_at DESC);

COMMENT ON TABLE scenarios IS 'Saved calculation scenarios that users want to preserve';
COMMENT ON COLUMN scenarios.id IS 'Unique identifier for the scenario';
COMMENT ON COLUMN scenarios.user_id IS 'User who created this scenario';
COMMENT ON COLUMN scenarios.calculator_type_id IS 'Type of calculator this scenario is for';
COMMENT ON COLUMN scenarios.title IS 'User-defined title for this scenario (e.g., "Conservative Investment Plan")';
COMMENT ON COLUMN scenarios.inputs IS 'JSON object containing the input parameters for this scenario';
COMMENT ON COLUMN scenarios.created_at IS 'Timestamp when the scenario was created';
COMMENT ON COLUMN scenarios.updated_at IS 'Timestamp when the scenario was last updated';
