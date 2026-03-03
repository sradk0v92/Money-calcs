-- Allow updating calculation rows under RLS
-- Needed for editing saved calculation metadata (e.g., title)

DROP POLICY IF EXISTS "Users can update their own calculations" ON calculations;

CREATE POLICY "Users can update their own calculations"
  ON calculations FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (user_id = auth.uid());
