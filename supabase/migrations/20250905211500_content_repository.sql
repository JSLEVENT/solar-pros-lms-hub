-- Content Repository & Learning Plans Schema

-- Enum for learning plan item types
DO $$ BEGIN
  CREATE TYPE public.learning_plan_item_type AS ENUM ('asset','course');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Folders (hierarchical)
CREATE TABLE IF NOT EXISTS public.content_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.content_folders(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assets (uploaded files OR external links)
CREATE TABLE IF NOT EXISTS public.content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT, -- storage object path if uploaded
  external_url TEXT, -- YouTube / Vimeo / PDF link etc
  content_type TEXT, -- mime or logical type (video, pdf, doc, link)
  folder_id UUID REFERENCES public.content_folders(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tags
CREATE TABLE IF NOT EXISTS public.content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name CITEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Asset <-> Tag junction
CREATE TABLE IF NOT EXISTS public.content_asset_tags (
  asset_id UUID REFERENCES public.content_assets(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.content_tags(id) ON DELETE CASCADE,
  PRIMARY KEY(asset_id, tag_id)
);

-- Learning Plans
CREATE TABLE IF NOT EXISTS public.learning_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Learning Plan Items (ordered)
CREATE TABLE IF NOT EXISTS public.learning_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.learning_plans(id) ON DELETE CASCADE,
  item_type public.learning_plan_item_type NOT NULL,
  asset_id UUID REFERENCES public.content_assets(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Course ↔ Asset mapping (ordered assets inside a course)
CREATE TABLE IF NOT EXISTS public.course_content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.content_assets(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 1,
  UNIQUE(course_id, asset_id)
);

-- Basic RLS enable
ALTER TABLE public.content_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_asset_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_content_assets ENABLE ROW LEVEL SECURITY;

-- Policies (simple: everyone authenticated can read; admins/owners manage; creators manage their own)
CREATE POLICY "folders_select_all" ON public.content_folders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "assets_select_all" ON public.content_assets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tags_select_all" ON public.content_tags FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "plans_select_all" ON public.learning_plans FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "plan_items_select_all" ON public.learning_plan_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "course_assets_select_all" ON public.course_content_assets FOR SELECT USING (auth.role() = 'authenticated');

-- Helper function to check if profile is owner/admin
DO $$ BEGIN
CREATE OR REPLACE FUNCTION public.is_owner_or_admin_role(uid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = uid AND p.role IN ('owner','admin'));
$$; EXCEPTION WHEN others THEN NULL; END $$;

-- Write policies (manage)
CREATE POLICY "folders_manage_admin" ON public.content_folders FOR ALL USING (public.is_owner_or_admin_role(auth.uid()));
CREATE POLICY "assets_manage_admin" ON public.content_assets FOR ALL USING (public.is_owner_or_admin_role(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "tags_manage_admin" ON public.content_tags FOR ALL USING (public.is_owner_or_admin_role(auth.uid()));
CREATE POLICY "plans_manage_admin" ON public.learning_plans FOR ALL USING (public.is_owner_or_admin_role(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "plan_items_manage_admin" ON public.learning_plan_items FOR ALL USING (public.is_owner_or_admin_role(auth.uid()));
CREATE POLICY "course_assets_manage_admin" ON public.course_content_assets FOR ALL USING (public.is_owner_or_admin_role(auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_assets_folder ON public.content_assets(folder_id);
CREATE INDEX IF NOT EXISTS idx_content_asset_tags_asset ON public.content_asset_tags(asset_id);
CREATE INDEX IF NOT EXISTS idx_learning_plan_items_plan ON public.learning_plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_course_content_assets_course ON public.course_content_assets(course_id);
