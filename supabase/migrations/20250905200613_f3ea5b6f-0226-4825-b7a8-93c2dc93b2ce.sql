-- Drop specific policies that we know reference role
DROP POLICY IF EXISTS "Users can view virtual classes for enrolled courses" ON public.virtual_classes;

-- Now try to alter the role column type
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- Create enhanced role system enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'learner');

-- Update existing data first
UPDATE public.profiles SET role = 'learner' WHERE role NOT IN ('admin', 'instructor');
UPDATE public.profiles SET role = 'admin' WHERE role = 'instructor';

-- Now alter the column type
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE public.app_role USING 
  CASE 
    WHEN role = 'admin' THEN 'admin'::public.app_role
    WHEN role = 'instructor' THEN 'admin'::public.app_role
    ELSE 'learner'::public.app_role
  END;

-- Set default for role column
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'learner'::public.app_role;