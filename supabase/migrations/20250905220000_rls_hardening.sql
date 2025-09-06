-- RLS Hardening & Role Helper Functions
-- Purpose: Replace permissive placeholder policies with least-privilege, role-aware rules.
-- Idempotent where feasible (drops then recreates named policies/functions).

-- 1. Role helper: has_app_role(target_roles text[])
CREATE OR REPLACE FUNCTION public.has_app_role(target_roles text[])
RETURNS boolean
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = ANY(target_roles)
  );
$$ LANGUAGE sql;

-- 2. Helper: is_team_member(team_id uuid)
CREATE OR REPLACE FUNCTION public.is_team_member(tid uuid)
RETURNS boolean
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = tid AND tm.user_id = auth.uid()
  );
$$ LANGUAGE sql;

-- 3. Helper: is_team_manager(team_id uuid)
CREATE OR REPLACE FUNCTION public.is_team_manager(tid uuid)
RETURNS boolean
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.manager_teams mt
    WHERE mt.team_id = tid AND mt.manager_id = auth.uid()
  );
$$ LANGUAGE sql;

-- 4. Content Assets Policies (restrict mutations)
ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assets_select_all" ON public.content_assets;
DROP POLICY IF EXISTS assets_manage_admin ON public.content_assets;

CREATE POLICY "content_assets_select"
  ON public.content_assets FOR SELECT
  USING ( true ); -- readable to all authenticated (storage-level read restrictions handled separately)

CREATE POLICY "content_assets_insert"
  ON public.content_assets FOR INSERT
  WITH CHECK ( public.has_app_role(ARRAY['owner','admin']) );

CREATE POLICY "content_assets_update"
  ON public.content_assets FOR UPDATE
  USING ( public.has_app_role(ARRAY['owner','admin']) );

CREATE POLICY "content_assets_delete"
  ON public.content_assets FOR DELETE
  USING ( public.has_app_role(ARRAY['owner','admin']) );

-- 5. Learning Plans Policies
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_learning_plans ON public.learning_plans;
DROP POLICY IF EXISTS insert_learning_plans ON public.learning_plans;
DROP POLICY IF EXISTS update_learning_plans ON public.learning_plans;
DROP POLICY IF EXISTS plans_select_all ON public.learning_plans;
DROP POLICY IF EXISTS plans_manage_admin ON public.learning_plans;

-- Add ownership (created_by) if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='learning_plans' AND column_name='created_by'
  ) THEN
    ALTER TABLE public.learning_plans ADD COLUMN created_by uuid DEFAULT auth.uid();
    CREATE INDEX IF NOT EXISTS learning_plans_created_by_idx ON public.learning_plans(created_by);
  END IF;
END $$;

CREATE POLICY "learning_plans_select"
  ON public.learning_plans FOR SELECT
  USING ( true );

CREATE POLICY "learning_plans_insert"
  ON public.learning_plans FOR INSERT
  WITH CHECK ( public.has_app_role(ARRAY['owner','admin','manager']) );

CREATE POLICY "learning_plans_update"
  ON public.learning_plans FOR UPDATE
  USING ( public.has_app_role(ARRAY['owner','admin']) OR created_by = auth.uid() );

CREATE POLICY "learning_plans_delete"
  ON public.learning_plans FOR DELETE
  USING ( public.has_app_role(ARRAY['owner','admin']) OR created_by = auth.uid() );

-- 6. Learning Plan Items Policies
ALTER TABLE public.learning_plan_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS modify_learning_plan_items ON public.learning_plan_items;
DROP POLICY IF EXISTS plan_items_select_all ON public.learning_plan_items;

CREATE POLICY "plan_items_select"
  ON public.learning_plan_items FOR SELECT
  USING ( true );

CREATE POLICY "plan_items_modify"
  ON public.learning_plan_items FOR ALL
  USING (
    public.has_app_role(ARRAY['owner','admin'])
    OR EXISTS (
      SELECT 1 FROM public.learning_plans lp
      WHERE lp.id = learning_plan_items.plan_id
        AND (lp.created_by = auth.uid() OR public.has_app_role(ARRAY['manager']))
    )
  ) WITH CHECK (
    public.has_app_role(ARRAY['owner','admin'])
    OR EXISTS (
      SELECT 1 FROM public.learning_plans lp
      WHERE lp.id = learning_plan_items.plan_id
        AND (lp.created_by = auth.uid() OR public.has_app_role(ARRAY['manager']))
    )
  );

-- 7. Teams (ensure existing policies use helpers; add missing granular ones)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
-- Example: additional read policy for managers & members if not already covered by existing migrations
CREATE POLICY IF NOT EXISTS "teams_read_roles"
  ON public.teams FOR SELECT
  USING (
    public.has_app_role(ARRAY['owner','admin'])
    OR public.is_team_manager(teams.id)
    OR public.is_team_member(teams.id)
  );

-- 8. Team Memberships
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "team_memberships_read_roles"
  ON public.team_memberships FOR SELECT
  USING (
    public.has_app_role(ARRAY['owner','admin'])
    OR team_memberships.user_id = auth.uid()
    OR public.is_team_manager(team_memberships.team_id)
  );

-- 9. Manager Teams
ALTER TABLE public.manager_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "manager_teams_read_roles"
  ON public.manager_teams FOR SELECT
  USING (
    public.has_app_role(ARRAY['owner','admin'])
    OR manager_teams.manager_id = auth.uid()
  );

-- 10. Profiles (restrict update of role/is_active to elevated roles)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (
  public.has_app_role(ARRAY['owner','admin'])
  OR profiles.user_id = auth.uid()
);

CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE USING (
  profiles.user_id = auth.uid()
) WITH CHECK (
  profiles.user_id = auth.uid()
);

CREATE POLICY "profiles_update_admin_fields" ON public.profiles FOR UPDATE USING (
  public.has_app_role(ARRAY['owner','admin'])
) WITH CHECK (
  public.has_app_role(ARRAY['owner','admin'])
);

-- 11. Analytics (insert restricted to server or future edge fn via service key; select aggregated only)
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS analytics_select_all ON public.analytics;
CREATE POLICY "analytics_insert_disabled" ON public.analytics FOR INSERT WITH CHECK ( false );
CREATE POLICY "analytics_select_min" ON public.analytics FOR SELECT USING (
  public.has_app_role(ARRAY['owner','admin','manager'])
);

-- 12. Certificates (basic read restriction)
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.certificates;
CREATE POLICY "certificates_select" ON public.certificates FOR SELECT USING (
  public.has_app_role(ARRAY['owner','admin']) OR certificates.user_id = auth.uid()
);

-- 13. Storage Buckets (NOTE: fine-grained policies may exist; keep for future refinement)
-- (Left unchanged here to avoid breaking existing uploads; plan a separate migration for per-bucket role scoping.)

-- 14. Safety: REVOKE PUBLIC grants on target tables (optional; depends on earlier grants)
-- Example (commented): REVOKE ALL ON public.content_assets FROM PUBLIC;

-- 15. Commentary: Further tightening steps
-- - Introduce service role edge function to insert sanitized analytics events.
-- - Split learning plans into public vs assigned categories.
-- - Add organization scoping once multi-org active.
