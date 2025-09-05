-- Create enhanced role system
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'learner');

-- Update profiles table to use the new role enum
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

-- Set jordanslevent@gmail.com as owner role
UPDATE public.profiles 
SET role = 'owner'::public.app_role 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'jordanslevent@gmail.com'
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team memberships table (learners assigned to teams)
CREATE TABLE public.team_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, team_id)
);

-- Create manager teams table (managers assigned to teams - many to many)
CREATE TABLE public.manager_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(manager_id, team_id)
);

-- Create content assignments table for multi-level content delivery
CREATE TABLE public.content_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL, -- can reference courses, modules, assessments
  content_type TEXT NOT NULL, -- 'course', 'module', 'assessment'
  assignment_type TEXT NOT NULL, -- 'organization', 'team', 'individual'
  organization_id UUID REFERENCES public.organizations(id),
  team_id UUID REFERENCES public.teams(id),
  user_id UUID REFERENCES auth.users(id),
  assigned_by UUID REFERENCES auth.users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (
    (assignment_type = 'organization' AND organization_id IS NOT NULL AND team_id IS NULL AND user_id IS NULL) OR
    (assignment_type = 'team' AND team_id IS NOT NULL AND user_id IS NULL) OR
    (assignment_type = 'individual' AND user_id IS NOT NULL)
  )
);

-- Add team_id to analytics table for team-level tracking
ALTER TABLE public.analytics 
ADD COLUMN team_id UUID REFERENCES public.teams(id);

-- Enable RLS on new tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_assignments ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS public.app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Create function to check if user is owner/admin
CREATE OR REPLACE FUNCTION public.is_owner_or_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role IN ('owner', 'admin') FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Create function to check if user can manage team
CREATE OR REPLACE FUNCTION public.can_manage_team(user_uuid UUID, team_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = user_uuid AND role IN ('owner', 'admin')
  ) OR EXISTS (
    SELECT 1 FROM public.manager_teams WHERE manager_id = user_uuid AND team_id = team_uuid
  );
$$;

-- RLS Policies for teams
CREATE POLICY "Owners and admins can manage all teams"
ON public.teams FOR ALL
USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Managers can view their assigned teams"
ON public.teams FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.manager_teams 
    WHERE manager_id = auth.uid() AND team_id = teams.id
  )
);

CREATE POLICY "Team members can view their teams"
ON public.teams FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_memberships 
    WHERE user_id = auth.uid() AND team_id = teams.id
  )
);

-- RLS Policies for team memberships
CREATE POLICY "Owners and admins can manage all team memberships"
ON public.team_memberships FOR ALL
USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Managers can manage memberships for their teams"
ON public.team_memberships FOR ALL
USING (public.can_manage_team(auth.uid(), team_id));

CREATE POLICY "Users can view their own team memberships"
ON public.team_memberships FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies for manager teams
CREATE POLICY "Owners and admins can manage manager assignments"
ON public.manager_teams FOR ALL
USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Managers can view their own assignments"
ON public.manager_teams FOR SELECT
USING (manager_id = auth.uid());

-- RLS Policies for content assignments
CREATE POLICY "Owners and admins can manage all content assignments"
ON public.content_assignments FOR ALL
USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Managers can manage assignments for their teams"
ON public.content_assignments FOR ALL
USING (
  assignment_type = 'team' AND 
  public.can_manage_team(auth.uid(), team_id)
);

CREATE POLICY "Users can view their content assignments"
ON public.content_assignments FOR SELECT
USING (
  user_id = auth.uid() OR
  (assignment_type = 'team' AND EXISTS (
    SELECT 1 FROM public.team_memberships 
    WHERE user_id = auth.uid() AND team_id = content_assignments.team_id
  ))
);

-- Update existing RLS policies for profiles to allow role management
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  -- Users can update their own profile but not change role
  (auth.uid() = user_id AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())) OR
  -- Owners can change any role
  (public.get_user_role(auth.uid()) = 'owner') OR
  -- Admins can assign manager/learner roles but not owner/admin
  (public.get_user_role(auth.uid()) = 'admin' AND role IN ('manager', 'learner'))
);

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for team analytics
CREATE OR REPLACE VIEW public.team_analytics AS
SELECT 
  t.id as team_id,
  t.name as team_name,
  COUNT(tm.user_id) as member_count,
  COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed_courses,
  AVG(e.progress) as avg_progress,
  COUNT(DISTINCT e.course_id) as total_courses_assigned
FROM public.teams t
LEFT JOIN public.team_memberships tm ON t.id = tm.team_id
LEFT JOIN public.enrollments e ON tm.user_id = e.user_id
GROUP BY t.id, t.name;