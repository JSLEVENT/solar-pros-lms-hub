-- Add missing policies for remaining tables

-- Policies for certificate_templates
CREATE POLICY "Owners and admins can manage certificate templates"
ON public.certificate_templates FOR ALL
USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Everyone can view certificate templates"
ON public.certificate_templates FOR SELECT
USING (true);

-- Policies for audit_logs
CREATE POLICY "Owners and admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.is_owner_or_admin(auth.uid()));

-- Create team analytics view
CREATE OR REPLACE VIEW public.team_analytics AS
SELECT 
  t.id as team_id,
  t.name as team_name,
  COUNT(tm.user_id) as member_count,
  COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed_courses,
  AVG(e.progress) as avg_progress,
  COUNT(DISTINCT e.course_id) as total_courses_assigned
FROM public.teams t
LEFT JOIN public.team_memberships tm ON t.id = tm.team_id
LEFT JOIN public.enrollments e ON tm.user_id = e.user_id
GROUP BY t.id, t.name;