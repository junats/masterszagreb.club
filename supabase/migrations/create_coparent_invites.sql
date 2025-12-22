-- Calendar Invite Database Setup
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ewwghrvoevgbvwzlomct/sql

-- Create the invites table
CREATE TABLE IF NOT EXISTS coparent_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invited_email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE coparent_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own invites
CREATE POLICY "Users can view own invites" ON coparent_invites
  FOR SELECT USING (auth.uid() = invited_by);

-- Policy: Users can create invites
CREATE POLICY "Users can create invites" ON coparent_invites
  FOR INSERT WITH CHECK (auth.uid() = invited_by);

-- Verify table was created
SELECT * FROM coparent_invites LIMIT 1;
