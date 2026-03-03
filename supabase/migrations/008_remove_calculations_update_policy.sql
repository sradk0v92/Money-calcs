-- Remove calculations UPDATE policy to disable editing calculation records
DROP POLICY IF EXISTS "Users can update their own calculations" ON calculations;
