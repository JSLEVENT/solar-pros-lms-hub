-- Drop the security definer view and recreate without it
DROP VIEW IF EXISTS public.team_analytics;

-- Create regular view for team analytics
CREATE VIEW public.team_analytics AS
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