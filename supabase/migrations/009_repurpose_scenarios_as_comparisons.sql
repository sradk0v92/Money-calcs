-- Repurpose scenarios table from "saved templates" to "saved comparisons"
-- This migration transforms the scenarios table to store comparisons between two calculations

-- Step 1: Add new comparison columns
ALTER TABLE scenarios ADD COLUMN left_calculation_id UUID REFERENCES calculations(id) ON DELETE CASCADE;
ALTER TABLE scenarios ADD COLUMN right_calculation_id UUID REFERENCES calculations(id) ON DELETE CASCADE;

-- Step 2: Drop the inputs column (no longer needed for comparisons)
ALTER TABLE scenarios DROP COLUMN inputs;

-- Step 3: Update comments to reflect new purpose
COMMENT ON TABLE scenarios IS 'Saved comparisons between two calculations';
COMMENT ON COLUMN scenarios.left_calculation_id IS 'The left calculation being compared';
COMMENT ON COLUMN scenarios.right_calculation_id IS 'The right calculation being compared';

-- Step 4: Create indexes for the new foreign keys for efficient lookups
CREATE INDEX idx_scenarios_left_calculation_id ON scenarios(left_calculation_id);
CREATE INDEX idx_scenarios_right_calculation_id ON scenarios(right_calculation_id);

-- Note: Existing RLS policies from 005_enable_rls_and_create_policies.sql still apply:
-- - Users can only create comparisons with their own user_id
-- - Users can only read/delete comparisons they own
-- - The referenced calculations are protected by their own RLS policies
