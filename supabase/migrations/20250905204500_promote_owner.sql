-- Promote specific user to owner role
UPDATE public.profiles
SET role = 'owner'::public.app_role
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'jordasnlevent@gmail.com'
);
