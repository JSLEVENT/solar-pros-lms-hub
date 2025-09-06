-- Add bio column to profiles if it does not exist (safety micro-migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='bio'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;
END $$;

-- (Optional) Add other enrichment columns if they were missed for any reason
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='display_name') THEN
    ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='job_title') THEN
    ALTER TABLE public.profiles ADD COLUMN job_title TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='time_zone') THEN
    ALTER TABLE public.profiles ADD COLUMN time_zone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='locale') THEN
    ALTER TABLE public.profiles ADD COLUMN locale TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='preferences') THEN
    ALTER TABLE public.profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;
