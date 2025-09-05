-- Create a new column with the enum type (enum already exists)
ALTER TABLE public.profiles ADD COLUMN new_role public.app_role DEFAULT 'learner'::public.app_role;

-- Update the new column with converted values
UPDATE public.profiles 
SET new_role = CASE 
  WHEN role = 'admin' THEN 'admin'::public.app_role
  WHEN role = 'instructor' THEN 'admin'::public.app_role
  ELSE 'learner'::public.app_role
END;

-- Set jordanslevent@gmail.com as owner role
UPDATE public.profiles 
SET new_role = 'owner'::public.app_role 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'jordanslevent@gmail.com'
);

-- Drop the old column and rename the new one
ALTER TABLE public.profiles DROP COLUMN role;
ALTER TABLE public.profiles RENAME COLUMN new_role TO role;

-- Set the column as NOT NULL
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;

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
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  assignment_type TEXT NOT NULL,
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