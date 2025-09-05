-- Drop ALL policies that reference the role column
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage all modules" ON public.modules;
DROP POLICY IF EXISTS "Admins can manage all assessments" ON public.assessments;
DROP POLICY IF EXISTS "Admins can manage all virtual classes" ON public.virtual_classes;
DROP POLICY IF EXISTS "Users can view virtual classes for enrolled courses" ON public.virtual_classes;
DROP POLICY IF EXISTS "Admins can manage all attendance records" ON public.class_attendees;
DROP POLICY IF EXISTS "Instructors and admins can manage forums" ON public.forums;
DROP POLICY IF EXISTS "Users can view forums for enrolled courses" ON public.forums;
DROP POLICY IF EXISTS "Instructors and admins can manage question banks" ON public.question_banks;
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.questions;

-- Get a list of all policies that might reference the role column
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE definition LIKE '%role%' 
          AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END
$$;