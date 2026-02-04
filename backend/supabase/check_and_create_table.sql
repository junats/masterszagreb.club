-- Quick check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'coparent_invites'
);

-- If table doesn't exist, create it:
CREATE TABLE IF NOT EXISTS coparent_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invited_email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE coparent_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own invites" ON coparent_invites;
CREATE POLICY "Users can view own invites" ON coparent_invites
  FOR SELECT USING (auth.uid() = invited_by);

DROP POLICY IF EXISTS "Users can create invites" ON coparent_invites;
CREATE POLICY "Users can create invites" ON coparent_invites
  FOR INSERT WITH CHECK (auth.uid() = invited_by);

-- Test query
SELECT * FROM coparent_invites ORDER BY created_at DESC LIMIT 5;
