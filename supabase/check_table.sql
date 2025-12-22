-- Check if coparent_invites table exists and has data
SELECT 
    table_name 
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public' 
    AND table_name = 'coparent_invites';

-- If table exists, check recent invites
SELECT * FROM coparent_invites ORDER BY created_at DESC LIMIT 5;

-- If table doesn't exist, create it:
CREATE TABLE IF NOT EXISTS coparent_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invited_email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE coparent_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own invites" ON coparent_invites;
CREATE POLICY "Users can view own invites" ON coparent_invites
  FOR SELECT USING (auth.uid() = invited_by);

DROP POLICY IF EXISTS "Users can create invites" ON coparent_invites;
CREATE POLICY "Users can create invites" ON coparent_invites
  FOR INSERT WITH CHECK (auth.uid() = invited_by);
