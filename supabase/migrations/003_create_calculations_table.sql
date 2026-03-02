-- Create calculations table
-- Stores the history of calculations performed by users
CREATE TABLE calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calculator_type_id UUID NOT NULL REFERENCES calculator_types(id) ON DELETE RESTRICT,
  inputs JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_calculations_user_id ON calculations(user_id);
CREATE INDEX idx_calculations_calculator_type_id ON calculations(calculator_type_id);
CREATE INDEX idx_calculations_created_at ON calculations(created_at DESC);

COMMENT ON TABLE calculations IS 'History of calculations performed by users';
COMMENT ON COLUMN calculations.id IS 'Unique identifier for the calculation record';
COMMENT ON COLUMN calculations.user_id IS 'User who performed the calculation';
COMMENT ON COLUMN calculations.calculator_type_id IS 'Type of calculator used';
COMMENT ON COLUMN calculations.inputs IS 'JSON object containing all input parameters used in the calculation';
COMMENT ON COLUMN calculations.results IS 'JSON object containing the computed results';
COMMENT ON COLUMN calculations.created_at IS 'Timestamp when the calculation was performed';
