-- Temporary RLS disable for testing the admin panel
-- WARNING: This removes security - only use for development/testing
-- In production, you should implement proper authentication and policies

-- Disable RLS for testing (be careful with this!)
ALTER TABLE public.designs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_comments DISABLE ROW LEVEL SECURITY;

-- Insert some sample data for testing
INSERT INTO public.profiles (id, email, first_name, last_name, role) VALUES 
(gen_random_uuid(), 'john.doe@example.com', 'John', 'Doe', 'student'),
(gen_random_uuid(), 'jane.smith@example.com', 'Jane', 'Smith', 'student'),
(gen_random_uuid(), 'admin@example.com', 'Admin', 'User', 'admin');

-- Insert some sample designs
INSERT INTO public.designs (user_id, name, type, pages_count, description, status, figma_link) 
SELECT 
    p.id,
    'Sample Website Design',
    'website',
    5,
    'A modern responsive website design for a local business',
    'pending',
    'https://figma.com/sample'
FROM public.profiles p WHERE p.email = 'john.doe@example.com'
LIMIT 1;

INSERT INTO public.designs (user_id, name, type, pages_count, description, status) 
SELECT 
    p.id,
    'E-commerce Platform',
    'web_application',
    12,
    'Full-featured e-commerce platform with admin dashboard',
    'accepted'
FROM public.profiles p WHERE p.email = 'jane.smith@example.com'
LIMIT 1;

INSERT INTO public.designs (user_id, name, type, pages_count, description, status) 
SELECT 
    p.id,
    'Portfolio Website',
    'website',
    3,
    'Personal portfolio website for a designer',
    'in_development'
FROM public.profiles p WHERE p.email = 'john.doe@example.com'
LIMIT 1;

INSERT INTO public.designs (user_id, name, type, pages_count, description, status) 
SELECT 
    p.id,
    'Corporate Landing Page',
    'website',
    1,
    'Professional landing page for a tech company',
    'completed'
FROM public.profiles p WHERE p.email = 'jane.smith@example.com'
LIMIT 1;
