-- Tighten RLS: only owner/admin can change profiles.is_active; others may not alter it
-- Idempotent guard: function & trigger names checked before creation.

DO $$ BEGIN
  -- Create a dedicated trigger function if not existing (reuse logic for clarity)
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'enforce_is_active_admin_only'
  ) THEN
    EXECUTE $$CREATE FUNCTION public.enforce_is_active_admin_only()
    RETURNS trigger AS $$$$
    BEGIN
      IF NEW.is_active IS DISTINCT FROM OLD.is_active AND NOT public.has_app_role(ARRAY['owner','admin']) THEN
        RAISE EXCEPTION 'insufficient_privilege: only admin/owner may change is_active';
      END IF;
      RETURN NEW;
    END; $$$$ LANGUAGE plpgsql SECURITY DEFINER;$$;
  END IF;
END $$;

-- Recreate trigger (safe to drop first)
DROP TRIGGER IF EXISTS trg_enforce_is_active_admin_only ON public.profiles;
CREATE TRIGGER trg_enforce_is_active_admin_only
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_is_active_admin_only();

COMMENT ON TRIGGER trg_enforce_is_active_admin_only ON public.profiles IS 'Prevents non-admin from toggling is_active';