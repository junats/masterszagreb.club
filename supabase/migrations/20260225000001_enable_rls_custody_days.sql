-- Enable Row Level Security on custody_days table
-- This was missing from the initial migration, meaning existing policies were not being enforced.

ALTER TABLE custody_days ENABLE ROW LEVEL SECURITY;
