-- Enable RLS on calendar_activities table
-- Fixes: rls_disabled_in_public for public.calendar_activities

ALTER TABLE calendar_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view activities for custody days they have access to
CREATE POLICY "Users can view paired calendar activities" ON calendar_activities
  FOR SELECT USING (
    custody_day_id IN (
      SELECT cd.id FROM custody_days cd
      WHERE cd.shared_calendar_id IN (
        SELECT cp.id FROM coparent_pairs cp
        WHERE cp.user1_id = auth.uid() OR cp.user2_id = auth.uid()
      )
    )
  );

-- Policy: Users can insert activities for custody days they have access to
CREATE POLICY "Users can insert paired calendar activities" ON calendar_activities
  FOR INSERT WITH CHECK (
    custody_day_id IN (
      SELECT cd.id FROM custody_days cd
      WHERE cd.shared_calendar_id IN (
        SELECT cp.id FROM coparent_pairs cp
        WHERE cp.user1_id = auth.uid() OR cp.user2_id = auth.uid()
      )
    )
  );

-- Policy: Users can update activities for custody days they have access to
CREATE POLICY "Users can update paired calendar activities" ON calendar_activities
  FOR UPDATE USING (
    custody_day_id IN (
      SELECT cd.id FROM custody_days cd
      WHERE cd.shared_calendar_id IN (
        SELECT cp.id FROM coparent_pairs cp
        WHERE cp.user1_id = auth.uid() OR cp.user2_id = auth.uid()
      )
    )
  );

-- Policy: Users can delete activities for custody days they have access to
CREATE POLICY "Users can delete paired calendar activities" ON calendar_activities
  FOR DELETE USING (
    custody_day_id IN (
      SELECT cd.id FROM custody_days cd
      WHERE cd.shared_calendar_id IN (
        SELECT cp.id FROM coparent_pairs cp
        WHERE cp.user1_id = auth.uid() OR cp.user2_id = auth.uid()
      )
    )
  );
