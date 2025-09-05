-- Extend profiles with richer personalization & analytics fields
-- Add missing roles to constraint, add display & engagement columns, and analytics-driven triggers/views

-- 1. Relax & recreate role constraint to include manager/owner
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('learner','instructor','manager','admin','owner'));

-- 2. Add new profile columns (idempotent pattern: add if not exists)
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio') THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='preferences') THEN
    ALTER TABLE public.profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_active_at') THEN
    ALTER TABLE public.profiles ADD COLUMN last_active_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='first_login_at') THEN
    ALTER TABLE public.profiles ADD COLUMN first_login_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_login_at') THEN
    ALTER TABLE public.profiles ADD COLUMN last_login_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='login_count') THEN
    ALTER TABLE public.profiles ADD COLUMN login_count INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='total_learning_seconds') THEN
    ALTER TABLE public.profiles ADD COLUMN total_learning_seconds BIGINT NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 3. Helpful indexes
CREATE INDEX IF NOT EXISTS profiles_last_active_idx ON public.profiles (last_active_at DESC);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- 4. Trigger function to update engagement fields from analytics inserts
CREATE OR REPLACE FUNCTION public.apply_analytics_profile_updates()
RETURNS TRIGGER AS $$
DECLARE
  evt TEXT := NEW.event_type;
BEGIN
  -- Always bump last_active_at for most activity events
  IF evt IN ('page_view','course_view','module_complete','video_watch','assessment_start','assessment_complete','course_enrollment','certificate_download') THEN
    UPDATE public.profiles SET last_active_at = now() WHERE user_id = NEW.user_id;
  END IF;

  -- Special handling for login event
  IF evt = 'user_login' THEN
    UPDATE public.profiles
      SET last_login_at = now(),
          first_login_at = COALESCE(first_login_at, now()),
          login_count = login_count + 1,
          last_active_at = now()
      WHERE user_id = NEW.user_id;
  END IF;

  -- Track cumulative learning seconds from video_watch metadata if supplied
  IF evt = 'video_watch' AND NEW.metadata ? 'position' THEN
    -- position treated as seconds watched in this segment
    UPDATE public.profiles
      SET total_learning_seconds = total_learning_seconds + COALESCE( (NEW.metadata->>'position')::BIGINT, 0 )
      WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_analytics_profile_updates ON public.analytics;
CREATE TRIGGER trg_analytics_profile_updates
AFTER INSERT ON public.analytics
FOR EACH ROW EXECUTE FUNCTION public.apply_analytics_profile_updates();

-- 5. User engagement summary view (lightweight, can be expanded later)
CREATE OR REPLACE VIEW public.user_metrics AS
SELECT
  p.user_id,
  p.full_name,
  COALESCE(p.display_name, split_part(p.full_name, ' ', 1)) AS display_name,
  p.role,
  p.job_title,
  p.last_active_at,
  p.login_count,
  p.total_learning_seconds,
  COUNT(a.id) AS total_events,
  MAX(a.created_at) AS last_event_at,
  (SELECT COUNT(1) FROM public.analytics a2 WHERE a2.user_id = p.user_id AND a2.event_type = 'course_enrollment') AS course_enrollments,
  (SELECT COUNT(1) FROM public.analytics a3 WHERE a3.user_id = p.user_id AND a3.event_type = 'module_complete') AS modules_completed,
  (SELECT COUNT(1) FROM public.analytics a4 WHERE a4.user_id = p.user_id AND a4.event_type = 'certificate_download') AS certificates_downloaded
FROM public.profiles p
LEFT JOIN public.analytics a ON a.user_id = p.user_id
GROUP BY p.user_id, p.full_name, p.role, p.job_title, p.last_active_at, p.login_count, p.total_learning_seconds, p.display_name;

-- 6. Grant select on view via existing profile policy (view inherits RLS from underlying tables)
-- (No extra policies needed; ensure analytics/profile select RLS already allows appropriate access)
