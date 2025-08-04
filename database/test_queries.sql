-- Quick test queries to verify the database setup
-- Run these in your Supabase SQL editor to check if everything is set up correctly

-- 1. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('designs', 'profiles', 'design_status_history', 'design_comments');

-- 2. Check designs table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'designs' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if there are any designs in the table
SELECT COUNT(*) as total_designs FROM public.designs;

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('designs', 'profiles')
ORDER BY tablename, policyname;

-- 5. Sample data query (if any exists)
SELECT id, name, status, created_at
FROM public.designs
LIMIT 5;
