-- Standalone Design Management Schema
-- This version includes a basic profiles table if it doesn't exist
-- Run this ONLY if you haven't run user_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table if it doesn't exist (basic version)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    username TEXT UNIQUE,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'admin', 'volunteer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Basic profiles policies (if not already created)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- DESIGNS TABLE
-- =============================================
CREATE TABLE public.designs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('web_application', 'website')),
    pages_count INTEGER NOT NULL DEFAULT 1,
    figma_link TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_development', 'completed', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    development_started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id)
);

-- =============================================
-- DESIGN STATUS HISTORY TABLE
-- =============================================
CREATE TABLE public.design_status_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    design_id UUID REFERENCES public.designs(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- DESIGN COMMENTS TABLE
-- =============================================
CREATE TABLE public.design_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    design_id UUID REFERENCES public.designs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    is_admin_comment BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_designs_user_id ON public.designs(user_id);
CREATE INDEX idx_designs_status ON public.designs(status);
CREATE INDEX idx_designs_created_at ON public.designs(created_at);
CREATE INDEX idx_design_status_history_design_id ON public.design_status_history(design_id);
CREATE INDEX idx_design_comments_design_id ON public.design_comments(design_id);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_comments ENABLE ROW LEVEL SECURITY;

-- Designs policies
CREATE POLICY "Users can view their own designs" ON public.designs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own designs" ON public.designs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own designs when pending" ON public.designs
    FOR UPDATE USING (
        auth.uid() = user_id AND status = 'pending'
    );

CREATE POLICY "Admins can view all designs" ON public.designs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'mentor')
        )
    );

CREATE POLICY "Admins can update design status" ON public.designs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'mentor')
        )
    );

-- Design status history policies
CREATE POLICY "Users can view their design history" ON public.design_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.designs 
            WHERE id = design_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all design history" ON public.design_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'mentor')
        )
    );

CREATE POLICY "Admins can create status history" ON public.design_status_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'mentor')
        )
    );

-- Design comments policies
CREATE POLICY "Users can view comments on their designs" ON public.design_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.designs 
            WHERE id = design_id 
            AND user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'mentor')
        )
    );

CREATE POLICY "Users can comment on their own designs" ON public.design_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.designs 
            WHERE id = design_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can comment on any design" ON public.design_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'mentor')
        )
    );

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update design updated_at timestamp
CREATE OR REPLACE FUNCTION update_design_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Update specific timestamp fields based on status change
    IF OLD.status != NEW.status THEN
        CASE NEW.status
            WHEN 'accepted' THEN NEW.accepted_at = NOW();
            WHEN 'in_development' THEN NEW.development_started_at = NOW();
            WHEN 'completed' THEN NEW.completed_at = NOW();
            WHEN 'rejected' THEN NEW.rejected_at = NOW();
            ELSE NULL;
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for design updates
CREATE TRIGGER update_designs_updated_at 
    BEFORE UPDATE ON public.designs
    FOR EACH ROW 
    EXECUTE FUNCTION update_design_updated_at();

-- Function to create status history when design status changes
CREATE OR REPLACE FUNCTION create_design_status_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history entry if status actually changed
    IF OLD.status != NEW.status THEN
        INSERT INTO public.design_status_history (design_id, status, changed_by, notes)
        VALUES (NEW.id, NEW.status, auth.uid(), NEW.admin_notes);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for status history
CREATE TRIGGER create_design_status_history_trigger 
    AFTER UPDATE ON public.designs
    FOR EACH ROW 
    EXECUTE FUNCTION create_design_status_history();

-- =============================================
-- HELPFUL VIEWS
-- =============================================

-- View for design timeline with status history
CREATE VIEW design_timeline AS
SELECT 
    d.id,
    d.name,
    d.type,
    d.status,
    d.user_id,
    COALESCE(p.first_name || ' ' || p.last_name, p.email) as user_name,
    d.created_at,
    d.updated_at,
    json_agg(
        json_build_object(
            'status', dsh.status,
            'changed_at', dsh.created_at,
            'changed_by', dsh.changed_by,
            'notes', dsh.notes
        ) ORDER BY dsh.created_at ASC
    ) as status_history
FROM designs d
LEFT JOIN profiles p ON d.user_id = p.id
LEFT JOIN design_status_history dsh ON d.id = dsh.design_id
GROUP BY d.id, p.first_name, p.last_name, p.email;

-- View for user design dashboard
CREATE VIEW user_design_dashboard AS
SELECT 
    d.id,
    d.name,
    d.type,
    d.pages_count,
    d.status,
    d.created_at,
    d.updated_at,
    COUNT(dc.id) as comment_count,
    CASE d.status
        WHEN 'pending' THEN 1
        WHEN 'accepted' THEN 2
        WHEN 'in_development' THEN 3
        WHEN 'completed' THEN 4
        WHEN 'rejected' THEN 0
    END as status_order
FROM designs d
LEFT JOIN design_comments dc ON d.id = dc.design_id
GROUP BY d.id
ORDER BY d.created_at DESC;
