# Database Migrations

This directory contains all SQL migrations for the Money Calculators application database.

## Migration Files

### 1. `001_create_profiles_table.sql`
Creates the `profiles` table that extends Supabase Auth with additional user information.

**Table: profiles**
- `id` (UUID, PK) - References auth.users.id
- `full_name` (text) - User's full name
- `role` (text) - User role: 'user' or 'admin'
- `created_at` (timestamp) - Profile creation timestamp
- `updated_at` (timestamp) - Profile update timestamp

### 2. `002_create_calculator_types_table.sql`
Creates the `calculator_types` table to store available calculator types.

**Table: calculator_types**
- `id` (UUID, PK) - Unique calculator type identifier
- `slug` (text, unique) - URL-friendly identifier (investment, emergency_fund, loan)
- `name` (text) - Display name
- `description` (text) - Description of the calculator
- `is_active` (boolean) - Whether the calculator is available

Initializes with 3 calculator types:
- Investment Calculator
- Emergency Fund Calculator
- Loan Calculator

### 3. `003_create_calculations_table.sql`
Creates the `calculations` table to store calculation history.

**Table: calculations**
- `id` (UUID, PK) - Unique calculation record identifier
- `user_id` (UUID, FK) - References auth.users.id
- `calculator_type_id` (UUID, FK) - References calculator_types.id
- `inputs` (jsonb) - User input parameters
- `results` (jsonb) - Computed results
- `created_at` (timestamp) - When the calculation was performed

**Indexes:**
- `idx_calculations_user_id` - For fast user calculation lookups
- `idx_calculations_calculator_type_id` - For calculator type filtering
- `idx_calculations_created_at` - For chronological queries

### 4. `004_create_scenarios_table.sql`
Creates the `scenarios` table for saved calculation scenarios.

**Table: scenarios**
- `id` (UUID, PK) - Unique scenario identifier
- `user_id` (UUID, FK) - References auth.users.id
- `calculator_type_id` (UUID, FK) - References calculator_types.id
- `title` (text) - User-defined scenario name
- `inputs` (jsonb) - Saved input parameters
- `created_at` (timestamp) - When the scenario was created
- `updated_at` (timestamp) - When the scenario was last updated

**Indexes:**
- `idx_scenarios_user_id` - For fast user scenario lookups
- `idx_scenarios_calculator_type_id` - For calculator type filtering
- `idx_scenarios_created_at` - For chronological queries

### 5. `005_enable_rls_and_create_policies.sql`
Enables Row Level Security (RLS) and creates security policies.

**Security Policies:**

#### Profiles Table
- **SELECT**: Public - All profiles are viewable
- **UPDATE**: Only own profile
- **INSERT**: Only own profile

#### Calculator Types Table
- **SELECT**: Everyone can view active calculators
- **INSERT/UPDATE/DELETE**: Admin only

#### Calculations Table
- **SELECT**: Users see their own, admins see all
- **INSERT**: Any authenticated user can create
- **DELETE**: Users can delete their own, admins can delete all

### 6. `006_add_calculation_summary_columns.sql`
Extends the `calculations` table for cleaner history UI and easier filtering.

**Added columns on calculations:**
- `title` (text, nullable) - Friendly saved calculation title
- `summary` (jsonb, nullable) - Compact summary values for list cards
- `scenario_id` (UUID, FK, nullable) - Optional link to `scenarios(id)`
- `updated_at` (timestamp) - Last updated timestamp

**Additional improvements:**
- Trigger keeps `updated_at` current on row updates
- Indexes added for `created_at desc`, `scenario_id`, and GIN on `summary`

### 7. `007_add_calculations_update_policy.sql`
Adds/refreshes RLS update policy for `calculations`.

**Policy behavior:**
- Users can update only their own calculations
- Admins can update all calculations
- `WITH CHECK` keeps ownership restricted to `auth.uid()` for normal users

### 8. `008_remove_calculations_update_policy.sql`
Removes calculations `UPDATE` policy to disable editing saved calculation records.

#### Scenarios Table
- **SELECT**: Users see their own, admins see all
- **INSERT**: Any authenticated user can create
- **UPDATE**: Users can update their own, admins can update all
- **DELETE**: Users can delete their own, admins can delete all

## Application Flow

1. User registers/logs in (Supabase Auth)
2. Profile created in `profiles` table
3. User selects a calculator from `calculator_types`
4. User input parameters stored in `calculations.inputs` (JSONB)
5. Results calculated and stored in `calculations.results` (JSONB)
6. User can save scenarios using `scenarios` table
7. User can view calculation history and scenarios
8. RLS policies ensure data access control

## Key Features

- **Multi-tenancy**: Each user only sees their own data
- **Admin Capabilities**: Admins can manage calculators and view all data
- **Flexible Storage**: JSONB fields allow storing calculator-specific parameters
- **Audit Trail**: All calculations and scenarios are timestamped
- **Referential Integrity**: Foreign keys prevent orphaned records
- **Performance**: Indexed columns for fast lookups

## Notes

- Migrations should be applied in order
- Each migration is idempotent where possible
- RLS is enabled by default on all tables for security
- JSONB fields allow storing different data structures per calculator type
