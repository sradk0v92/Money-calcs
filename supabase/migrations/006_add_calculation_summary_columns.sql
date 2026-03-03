-- Extend calculations table for richer history UI and linking to scenarios
ALTER TABLE calculations
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS summary JSONB,
  ADD COLUMN IF NOT EXISTS scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Keep updated_at in sync when rows are updated
CREATE OR REPLACE FUNCTION update_calculations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculations_updated_at ON calculations;

CREATE TRIGGER trg_calculations_updated_at
  BEFORE UPDATE ON calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_calculations_updated_at();

-- Additional indexes for list/detail queries and filtering
CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_calculations_calculator_type_id ON calculations(calculator_type_id);
CREATE INDEX IF NOT EXISTS idx_calculations_created_at_desc ON calculations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculations_scenario_id ON calculations(scenario_id);
CREATE INDEX IF NOT EXISTS idx_calculations_summary_gin ON calculations USING GIN (summary);

COMMENT ON COLUMN calculations.title IS 'Optional user-friendly title for a saved calculation';
COMMENT ON COLUMN calculations.summary IS 'Compact JSON object for history list cards (3-6 key values)';
COMMENT ON COLUMN calculations.scenario_id IS 'Optional linked scenario record';
COMMENT ON COLUMN calculations.updated_at IS 'Timestamp when this calculation row was last updated';
