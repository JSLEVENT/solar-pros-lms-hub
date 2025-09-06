-- Drop bio column (now deprecated) and add trigger to sync full_name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN bio;
  END IF;
END $$;

-- Create function to maintain full_name from first/last
CREATE OR REPLACE FUNCTION public.sync_full_name()
RETURNS TRIGGER AS $$
DECLARE
  fn TEXT;
  ln TEXT;
BEGIN
  fn := COALESCE(NEW.first_name, '');
  ln := COALESCE(NEW.last_name, '');
  NEW.full_name := trim(both ' ' FROM fn || ' ' || ln);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_full_name ON public.profiles;
CREATE TRIGGER trg_sync_full_name
BEFORE INSERT OR UPDATE OF first_name, last_name ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_full_name();