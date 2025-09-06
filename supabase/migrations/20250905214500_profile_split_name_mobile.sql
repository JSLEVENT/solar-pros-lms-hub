-- Split full_name into first_name / last_name and add mobile_number; deprecate bio field
-- Idempotent & safe: checks column existence first.

DO $$
BEGIN
  -- Add first_name if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='first_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN first_name TEXT;
  END IF;
  -- Add last_name if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_name TEXT;
  END IF;
  -- Add mobile_number if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='mobile_number'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN mobile_number TEXT;
    CREATE INDEX IF NOT EXISTS profiles_mobile_number_idx ON public.profiles (mobile_number);
  END IF;

  -- Backfill first_name / last_name from existing full_name if new columns are empty
  UPDATE public.profiles
  SET first_name = COALESCE(first_name, split_part(full_name, ' ', 1)),
      last_name = COALESCE(last_name, NULLIF(split_part(full_name, ' ', 2), ''))
  WHERE full_name IS NOT NULL;

  -- (Optional) Drop bio if it exists (commented out by default for backward compatibility)
  -- IF EXISTS (
  --   SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio'
  -- ) THEN
  --   ALTER TABLE public.profiles DROP COLUMN bio;
  -- END IF;
END $$;

-- Note: Application layer should start using first_name + last_name; keep full_name for legacy compatibility.