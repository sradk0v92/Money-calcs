-- Create calculator_types table
-- Stores the types of calculators available in the app
CREATE TABLE calculator_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE calculator_types IS 'Available calculator types in the application';
COMMENT ON COLUMN calculator_types.id IS 'Unique identifier for calculator type';
COMMENT ON COLUMN calculator_types.slug IS 'URL-friendly identifier (e.g., investment, emergency_fund, loan)';
COMMENT ON COLUMN calculator_types.name IS 'Display name of the calculator (e.g., Investment Calculator)';
COMMENT ON COLUMN calculator_types.description IS 'Brief description of what the calculator does';
COMMENT ON COLUMN calculator_types.is_active IS 'Whether this calculator is available to users';

-- Insert predefined calculator types
INSERT INTO calculator_types (slug, name, description, is_active) VALUES
  ('investment', 'Investment Calculator', 'Calculate investment returns and compound interest', true),
  ('emergency_fund', 'Emergency Fund Calculator', 'Determine how much you need in an emergency fund', true),
  ('loan', 'Loan Calculator', 'Calculate loan payments, total interest, and amortization', true);
