-- Migration to setup receipts storage bucket and RLS policies
-- FORCING PERMISSIVE ACCESS TO UNBLOCK DEVELOPMENT

-- 1. Create the 'receipts' bucket (public) if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'receipts', 'receipts', true
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. RLS is enabled by default on storage.objects in Supabase
-- Skipping ALTER TABLE to avoid ownership permission errors

-- 3. Policy: Allow ALL users (anon or auth) to INSERT into 'receipts' bucket
DROP POLICY IF EXISTS "Allow anonymous uploads to receipts" ON storage.objects;
CREATE POLICY "Allow anonymous uploads to receipts" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'receipts');

-- 4. Policy: Allow ALL users to SELECT from 'receipts' bucket
DROP POLICY IF EXISTS "Allow anonymous selects from receipts" ON storage.objects;
CREATE POLICY "Allow anonymous selects from receipts" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'receipts');

-- 5. Policy: Allow ALL users to UPDATE in 'receipts' bucket (broad for dev)
DROP POLICY IF EXISTS "Allow anonymous updates to receipts" ON storage.objects;
CREATE POLICY "Allow anonymous updates to receipts" ON storage.objects
FOR UPDATE TO anon, authenticated
USING (bucket_id = 'receipts');

-- 6. Policy: Allow ALL users to DELETE in 'receipts' bucket
DROP POLICY IF EXISTS "Allow anonymous deletes to receipts" ON storage.objects;
CREATE POLICY "Allow anonymous deletes to receipts" ON storage.objects
FOR DELETE TO anon, authenticated
USING (bucket_id = 'receipts');
