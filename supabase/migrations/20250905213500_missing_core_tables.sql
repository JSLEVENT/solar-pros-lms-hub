-- Ensure core LMS tables exist (idempotent)
-- learning_plans, learning_plan_items, content_assets (simple initial structure)
-- Safe to run multiple times: uses IF NOT EXISTS

CREATE TABLE IF NOT EXISTS public.learning_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES public.learning_plans(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  asset_id uuid,
  course_id uuid,
  label text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learning_plan_items_plan_idx ON public.learning_plan_items(plan_id, position);

CREATE TABLE IF NOT EXISTS public.content_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  folder_id uuid,
  content_type text,
  external_url text,
  file_path text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_assets_created_idx ON public.content_assets(created_at DESC);

-- Optional column additions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Basic RLS placeholders (adjust later)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='learning_plans' AND policyname='select_learning_plans') THEN
    ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;
    CREATE POLICY select_learning_plans ON public.learning_plans FOR SELECT USING ( true );
    CREATE POLICY insert_learning_plans ON public.learning_plans FOR INSERT WITH CHECK ( true );
    CREATE POLICY update_learning_plans ON public.learning_plans FOR UPDATE USING ( true );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='learning_plan_items' AND policyname='select_learning_plan_items') THEN
    ALTER TABLE public.learning_plan_items ENABLE ROW LEVEL SECURITY;
    CREATE POLICY select_learning_plan_items ON public.learning_plan_items FOR SELECT USING ( true );
    CREATE POLICY modify_learning_plan_items ON public.learning_plan_items FOR ALL USING ( true ) WITH CHECK ( true );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='content_assets' AND policyname='select_content_assets') THEN
    ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;
    CREATE POLICY select_content_assets ON public.content_assets FOR SELECT USING ( true );
    CREATE POLICY modify_content_assets ON public.content_assets FOR ALL USING ( true ) WITH CHECK ( true );
  END IF;
END $$;

-- TODO: tighten RLS with role checks (owner/admin broader, managers limited, learners read-only)
