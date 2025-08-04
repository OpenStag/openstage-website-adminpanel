-- Re-enable RLS after testing
-- Run this after you're done testing to restore security

-- Re-enable RLS
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_comments ENABLE ROW LEVEL SECURITY;

-- The original policies from design.sql will still be in place
