-- Drop all policies that contain 'role' in them first
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

-- Manually drop policies that likely reference the role column based on common patterns
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    -- Drop policies from courses table
    FOR policy_rec IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'courses' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.courses', policy_rec.policyname);
    END LOOP;
    
    -- Drop policies from modules table
    FOR policy_rec IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'modules' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.modules', policy_rec.policyname);
    END LOOP;
    
    -- Drop policies from assessments table
    FOR policy_rec IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'assessments' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.assessments', policy_rec.policyname);
    END LOOP;
    
    -- Drop policies from virtual_classes table
    FOR policy_rec IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'virtual_classes' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.virtual_classes', policy_rec.policyname);
    END LOOP;
    
    -- Drop policies from class_attendees table
    FOR policy_rec IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'class_attendees' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.class_attendees', policy_rec.policyname);
    END LOOP;
    
    -- Drop policies from forums table
    FOR policy_rec IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'forums' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.forums', policy_rec.policyname);
    END LOOP;
    
    -- Drop policies from question_banks table
    FOR policy_rec IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'question_banks' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.question_banks', policy_rec.policyname);
    END LOOP;
    
    -- Drop policies from questions table
    FOR policy_rec IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'questions' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.questions', policy_rec.policyname);
    END LOOP;
END
$$;