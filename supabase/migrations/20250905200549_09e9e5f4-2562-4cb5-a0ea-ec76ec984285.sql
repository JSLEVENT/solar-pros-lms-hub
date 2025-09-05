-- First create the enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'learner');

-- Create a new column with the enum type
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