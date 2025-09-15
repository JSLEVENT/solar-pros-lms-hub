-- Comprehensive schema additions: assessments, questions, attempts, certificates, study time, AI sessions, forums, leaderboard
-- Date: 2025-09-06
-- Idempotent patterns used (IF NOT EXISTS / exception handlers) so migration can be safely re-run.

-- 1. ENUMS ------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.assessment_type AS ENUM ('quiz','exam','practice');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.question_type AS ENUM ('multiple_choice','true_false','short_answer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. ASSESSMENTS CORE -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assessment_type public.assessment_type NOT NULL DEFAULT 'quiz',
  total_points INT NOT NULL DEFAULT 0,
  passing_score INT,               -- points required to pass (nullable = no pass/fail)
  time_limit_minutes INT,          -- optional time limit
  attempts_allowed INT,            -- null = unlimited
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type public.question_type NOT NULL,
  position INT NOT NULL DEFAULT 1,
  points INT NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.assessment_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  score INT,            -- computed points earned
  passed BOOLEAN,       -- computed if passing_score defined
  responses JSONB,      -- structured answers (question_id -> user response)
  duration_seconds INT, -- recorded time used
  UNIQUE(assessment_id, user_id, started_at) -- uniqueness per attempt start
);

-- 3. CERTIFICATES ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  certificate_code TEXT NOT NULL UNIQUE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. STUDY TIME ENTRIES (supports MyProgress) -------------------------------
CREATE TABLE IF NOT EXISTS public.study_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INT NOT NULL DEFAULT 0,
  source TEXT DEFAULT 'manual', -- manual, video_playback, integration
  metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_study_time_user ON public.study_time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_study_time_course ON public.study_time_entries(course_id);
CREATE INDEX IF NOT EXISTS idx_study_time_started ON public.study_time_entries(started_at DESC);

-- 5. AI TRAINING SESSIONS ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id TEXT,                  -- identifier of scenario template
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  messages JSONB DEFAULT '[]'::jsonb, -- conversation transcript (array of {role, content, ts})
  score INT,
  rating INT,                         -- user subjective rating (1-5) maybe
  metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user ON public.ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_scenario ON public.ai_sessions(scenario_id);

-- Simple leaderboard (aggregated) - can be refreshed via job or trigger; flexible metric
CREATE TABLE IF NOT EXISTS public.leaderboard_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,            -- e.g. 'ai_score','courses_completed'
  value NUMERIC NOT NULL DEFAULT 0,
  period TEXT DEFAULT 'all_time',  -- e.g. week_2025_36
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, metric, period)
);
CREATE INDEX IF NOT EXISTS idx_leaderboard_metric_period ON public.leaderboard_scores(metric, period);

-- 6. FORUMS ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_forum_topics_course ON public.forum_topics(course_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic ON public.forum_posts(topic_id);

-- 7. RLS ENABLE --------------------------------------------------------------
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- 8. SUPPORTING FN: role helper (if not already exists) ---------------------
DO $$ BEGIN
  CREATE OR REPLACE FUNCTION public.is_admin_or_instructor(uid UUID)
  RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.user_id = uid AND p.role IN ('admin','owner','instructor')
    );
  $$;
END $$;

-- 9. POLICIES ----------------------------------------------------------------
-- Read (authenticated) minimal
CREATE POLICY IF NOT EXISTS "assessments_read" ON public.assessments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "assessment_questions_read" ON public.assessment_questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "assessment_question_options_read" ON public.assessment_question_options FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "assessment_attempts_own_read" ON public.assessment_attempts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "certificates_read_own_or_admin" ON public.certificates FOR SELECT USING (user_id = auth.uid() OR public.is_owner_or_admin_role(auth.uid()));
CREATE POLICY IF NOT EXISTS "study_time_read_own" ON public.study_time_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "ai_sessions_read_own" ON public.ai_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "leaderboard_scores_read_all" ON public.leaderboard_scores FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "forum_topics_read" ON public.forum_topics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "forum_posts_read" ON public.forum_posts FOR SELECT USING (auth.role() = 'authenticated');

-- Write (restricted)
CREATE POLICY IF NOT EXISTS "assessments_manage" ON public.assessments FOR ALL USING (public.is_admin_or_instructor(auth.uid()));
CREATE POLICY IF NOT EXISTS "assessment_questions_manage" ON public.assessment_questions FOR ALL USING (public.is_admin_or_instructor(auth.uid()));
CREATE POLICY IF NOT EXISTS "assessment_question_options_manage" ON public.assessment_question_options FOR ALL USING (public.is_admin_or_instructor(auth.uid()));
CREATE POLICY IF NOT EXISTS "assessment_attempts_insert" ON public.assessment_attempts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "assessment_attempts_update_own_before_submit" ON public.assessment_attempts FOR UPDATE USING (user_id = auth.uid() AND submitted_at IS NULL);
CREATE POLICY IF NOT EXISTS "certificates_insert_admin" ON public.certificates FOR INSERT WITH CHECK (public.is_owner_or_admin_role(auth.uid()));
CREATE POLICY IF NOT EXISTS "study_time_manage_own" ON public.study_time_entries FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "ai_sessions_manage_own" ON public.ai_sessions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "leaderboard_scores_manage_admin" ON public.leaderboard_scores FOR ALL USING (public.is_owner_or_admin_role(auth.uid()));
CREATE POLICY IF NOT EXISTS "forum_topics_create" ON public.forum_topics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "forum_topics_update_owner" ON public.forum_topics FOR UPDATE USING (user_id = auth.uid() OR public.is_admin_or_instructor(auth.uid()));
CREATE POLICY IF NOT EXISTS "forum_posts_create" ON public.forum_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "forum_posts_update_owner" ON public.forum_posts FOR UPDATE USING (user_id = auth.uid() OR public.is_admin_or_instructor(auth.uid()));

-- 10. INDEXES ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_assessments_course ON public.assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON public.assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user ON public.assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment ON public.assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_course ON public.certificates(user_id, course_id);

-- 11. TRIGGER: auto update updated_at on assessments -------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_assessments_touch ON public.assessments;
CREATE TRIGGER trg_assessments_touch BEFORE UPDATE ON public.assessments
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 12. TRIGGER: compute attempt score & pass on submit ------------------------
CREATE OR REPLACE FUNCTION public.finalize_assessment_attempt()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  pass_threshold INT;
  total INT := 0;
BEGIN
  IF NEW.submitted_at IS NULL THEN
    RETURN NEW; -- only finalize on submit
  END IF;
  -- compute score if not already provided (for MCQ & TF using options)
  IF NEW.score IS NULL THEN
    SELECT a.passing_score INTO pass_threshold FROM public.assessments a WHERE a.id = NEW.assessment_id;
    -- naive aggregation: iterate answers in responses keyed by question_id, check correctness for MCQ/TF
    -- For performance, rely on SQL set operations; responses assumed {"question_id":"option_id"}
    WITH resp AS (
      SELECT (kv.key)::uuid AS question_id, (kv.value)::text AS chosen_option
      FROM jsonb_each_text(NEW.responses) kv
    ), correctness AS (
      SELECT r.question_id, o.is_correct, q.points
      FROM resp r
      JOIN public.assessment_questions q ON q.id = r.question_id
      LEFT JOIN public.assessment_question_options o ON o.question_id = q.id AND o.id::text = r.chosen_option
    )
    SELECT COALESCE(SUM(CASE WHEN is_correct THEN points ELSE 0 END),0) INTO total FROM correctness;
    NEW.score = total;
    IF pass_threshold IS NOT NULL THEN
      NEW.passed = (total >= pass_threshold);
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_finalize_attempt ON public.assessment_attempts;
CREATE TRIGGER trg_finalize_attempt BEFORE UPDATE ON public.assessment_attempts
FOR EACH ROW EXECUTE FUNCTION public.finalize_assessment_attempt();

-- 13. CERTIFICATE AUTO-ISSUE (optional: only for passed attempts) ------------
CREATE OR REPLACE FUNCTION public.issue_certificate_after_attempt()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  existing UUID;
  course UUID;
  code TEXT;
BEGIN
  IF NEW.submitted_at IS NULL OR NEW.passed IS DISTINCT FROM TRUE THEN
    RETURN NEW; -- only if passed
  END IF;
  SELECT a.course_id INTO course FROM public.assessments a WHERE a.id = NEW.assessment_id;
  -- ensure not already issued
  SELECT id INTO existing FROM public.certificates c WHERE c.user_id = NEW.user_id AND c.course_id = course LIMIT 1;
  IF existing IS NULL THEN
    code := encode(gen_random_bytes(6),'hex');
    INSERT INTO public.certificates (user_id, course_id, assessment_id, certificate_code)
    VALUES (NEW.user_id, course, NEW.assessment_id, code);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_issue_certificate ON public.assessment_attempts;
CREATE TRIGGER trg_issue_certificate AFTER UPDATE ON public.assessment_attempts
FOR EACH ROW EXECUTE FUNCTION public.issue_certificate_after_attempt();

-- 14. VIEW: simple leaderboard from certificates ----------------------------
CREATE OR REPLACE VIEW public.course_certificate_counts AS
SELECT user_id, COUNT(*) AS certificates_count
FROM public.certificates
GROUP BY user_id;

-- 15. COMMENTARY -------------------------------------------------------------
COMMENT ON TABLE public.assessments IS 'Assessments (quizzes/exams) for courses';
COMMENT ON TABLE public.assessment_attempts IS 'Learner attempts for assessments';
COMMENT ON TABLE public.certificates IS 'Issued course completion certificates';
COMMENT ON TABLE public.study_time_entries IS 'Per-session study time tracking';
COMMENT ON TABLE public.ai_sessions IS 'Stored AI conversation sessions';
COMMENT ON TABLE public.forum_topics IS 'Course discussion topics';
COMMENT ON TABLE public.forum_posts IS 'Posts/replies in discussion topics';

-- END MIGRATION
