-- Add co-parent pairing table to restrict calendar access to two users only

-- Create coparent_pairs table
CREATE TABLE IF NOT EXISTS coparent_pairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES auth.users(id) NOT NULL,
  user2_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

-- Enable RLS
ALTER TABLE coparent_pairs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own pairs
CREATE POLICY "Users can view own pairs" ON coparent_pairs
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Policy: Users can create pairs (when accepting invite)
CREATE POLICY "Users can create pairs" ON coparent_pairs
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Update custody_days table to use shared_calendar_id instead of user_id
-- This allows both co-parents to access the same calendar

-- First, add shared_calendar_id column
ALTER TABLE custody_days ADD COLUMN IF NOT EXISTS shared_calendar_id UUID;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_custody_days_shared_calendar ON custody_days(shared_calendar_id);

-- Update RLS policies for custody_days
DROP POLICY IF EXISTS "Users can view own custody days" ON custody_days;
DROP POLICY IF EXISTS "Users can insert own custody days" ON custody_days;
DROP POLICY IF EXISTS "Users can update own custody days" ON custody_days;
DROP POLICY IF EXISTS "Users can delete own custody days" ON custody_days;

-- New policies: Allow access if user is part of the co-parent pair
CREATE POLICY "Users can view paired custody days" ON custody_days
  FOR SELECT USING (
    shared_calendar_id IN (
      SELECT id FROM coparent_pairs 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert paired custody days" ON custody_days
  FOR INSERT WITH CHECK (
    shared_calendar_id IN (
      SELECT id FROM coparent_pairs 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Users can update paired custody days" ON custody_days
  FOR UPDATE USING (
    shared_calendar_id IN (
      SELECT id FROM coparent_pairs 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete paired custody days" ON custody_days
  FOR DELETE USING (
    shared_calendar_id IN (
      SELECT id FROM coparent_pairs 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Helper function to get or create shared calendar ID for current user
CREATE OR REPLACE FUNCTION get_shared_calendar_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pair_id UUID;
BEGIN
  -- Find existing pair
  SELECT id INTO pair_id
  FROM coparent_pairs
  WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  LIMIT 1;
  
  RETURN pair_id;
END;
$$;
