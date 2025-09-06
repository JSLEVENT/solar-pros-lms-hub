-- Ensure profiles.is_active exists (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON public.profiles (is_active);
