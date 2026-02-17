-- Co-Parent Access Control Migration
-- This restricts calendar access to exactly 2 paired users

-- Step 1: Create coparent_pairs table
CREATE TABLE IF NOT EXISTS coparent_pairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index to prevent duplicate pairs
CREATE UNIQUE INDEX IF NOT EXISTS idx_coparent_pairs_users 
ON coparent_pairs (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id));

-- Enable RLS on coparent_pairs
ALTER TABLE coparent_pairs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view pairs they're part of
DROP POLICY IF EXISTS "Users can view own pairs" ON coparent_pairs;
CREATE POLICY "Users can view own pairs" ON coparent_pairs
  FOR SELECT USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id
  );

-- Policy: Users can create pairs (only user1 initially)
DROP POLICY IF EXISTS "Users can create pairs" ON coparent_pairs;
CREATE POLICY "Users can create pairs" ON coparent_pairs
  FOR INSERT WITH CHECK (auth.uid() = user1_id);

-- Policy: Users can update pairs (to add user2)
DROP POLICY IF EXISTS "Users can update pairs" ON coparent_pairs;
CREATE POLICY "Users can update pairs" ON coparent_pairs
  FOR UPDATE USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id
  );

-- Step 2: Add shared_calendar_id to custody_days
ALTER TABLE custody_days 
ADD COLUMN IF NOT EXISTS shared_calendar_id UUID REFERENCES coparent_pairs(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_custody_days_shared_calendar 
ON custody_days(shared_calendar_id);

-- Step 3: Migrate existing data
-- For each user, create a pair and link their custody days
DO $$
DECLARE
  user_record RECORD;
  new_pair_id UUID;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM custody_days 
    WHERE shared_calendar_id IS NULL
  LOOP
    -- Create a new pair for this user
    INSERT INTO coparent_pairs (user1_id)
    VALUES (user_record.user_id)
    RETURNING id INTO new_pair_id;
    
    -- Update their custody days to use this pair
    UPDATE custody_days
    SET shared_calendar_id = new_pair_id
    WHERE user_id = user_record.user_id 
      AND shared_calendar_id IS NULL;
  END LOOP;
END $$;

-- Step 4: Update RLS policies for custody_days
DROP POLICY IF EXISTS "Users can view own custody days" ON custody_days;
DROP POLICY IF EXISTS "Users can insert own custody days" ON custody_days;
DROP POLICY IF EXISTS "Users can update own custody days" ON custody_days;
DROP POLICY IF EXISTS "Users can delete own custody days" ON custody_days;

-- New policies: Allow access only if user is in the pair
DROP POLICY IF EXISTS "Users can view paired custody days" ON custody_days;
CREATE POLICY "Users can view paired custody days" ON custody_days
  FOR SELECT USING (
    shared_calendar_id IN (
      SELECT id FROM coparent_pairs 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert paired custody days" ON custody_days;
CREATE POLICY "Users can insert paired custody days" ON custody_days
  FOR INSERT WITH CHECK (
    shared_calendar_id IN (
      SELECT id FROM coparent_pairs 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update paired custody days" ON custody_days;
CREATE POLICY "Users can update paired custody days" ON custody_days
  FOR UPDATE USING (
    shared_calendar_id IN (
      SELECT id FROM coparent_pairs 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete paired custody days" ON custody_days;
CREATE POLICY "Users can delete paired custody days" ON custody_days
  FOR DELETE USING (
    shared_calendar_id IN (
      SELECT id FROM coparent_pairs 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Step 5: Make shared_calendar_id required for new rows
-- (Keep it nullable for now to allow migration, can make NOT NULL later)

-- Verification query
SELECT 
  'Migration Complete' as status,
  COUNT(DISTINCT shared_calendar_id) as total_pairs,
  COUNT(*) as total_custody_days
FROM custody_days;
