-- Drop deprecated profile columns: display_name, locale, avatar_url
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='display_name') THEN
    ALTER TABLE public.profiles DROP COLUMN display_name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='locale') THEN
    ALTER TABLE public.profiles DROP COLUMN locale;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE public.profiles DROP COLUMN avatar_url;
  END IF;
END $$;