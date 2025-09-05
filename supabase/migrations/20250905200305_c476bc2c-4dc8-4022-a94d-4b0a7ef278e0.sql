-- Drop all policies that reference the role column
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage all modules" ON public.modules;
DROP POLICY IF EXISTS "Admins can manage all assessments" ON public.assessments;
DROP POLICY IF EXISTS "Admins can manage all virtual classes" ON public.virtual_classes;
DROP POLICY IF EXISTS "Admins can manage all attendance records" ON public.class_attendees;
DROP POLICY IF EXISTS "Instructors and admins can manage forums" ON public.forums;
DROP POLICY IF EXISTS "Users can view forums for enrolled courses" ON public.forums;
DROP POLICY IF EXISTS "Instructors and admins can manage question banks" ON public.question_banks;
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.questions;

-- Drop the existing role column constraint if it exists
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- Create enhanced role system enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'learner');

-- Update profiles table to use the new role enum with explicit casting
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

-- Set jordanslevent@gmail.com as owner role
UPDATE public.profiles 
SET role = 'owner'::public.app_role 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'jordanslevent@gmail.com'
);