-- Migration to limit daily uploads to 10 per user to control storage costs

-- 1. Enable RLS on storage.objects if not already enabled (usually is)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy to limit uploads
-- Note: This queries the storage.objects table itself. For high scale, consider a separate counter table.
CREATE POLICY "Enforce daily upload limit 10"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  (
    SELECT count(*)
    FROM storage.objects
    WHERE owner = auth.uid() 
      AND created_at >= (CURRENT_DATE)::timestamp
  ) < 10
);

-- 3. Create a view or table for usage tracking (optional, for the Dashboard/MCP to read)
CREATE OR REPLACE VIEW public.user_daily_usage AS
SELECT 
  owner as user_id,
  created_at::date as date,
  count(*) as upload_count
FROM storage.objects
GROUP BY owner, created_at::date;

COMMENT ON VIEW public.user_daily_usage IS 'Daily upload counts per user for cost monitoring';
