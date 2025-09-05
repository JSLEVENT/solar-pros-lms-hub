-- Recreate all RLS policies with new role system

-- Policies for teams table
CREATE POLICY "Owners and admins can manage all teams"
ON public.teams FOR ALL
USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Managers can view their assigned teams"
ON public.teams FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.manager_teams 
    WHERE manager_id = auth.uid() AND team_id = teams.id
  )
);

CREATE POLICY "Team members can view their teams"
ON public.teams FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_memberships 
    WHERE user_id = auth.uid() AND team_id = teams.id
  )
);

-- Policies for team memberships
CREATE POLICY "Owners and admins can manage all team memberships"
ON public.team_memberships FOR ALL
USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Managers can manage memberships for their teams"
ON public.team_memberships FOR ALL
USING (public.can_manage_team(auth.uid(), team_id));

CREATE POLICY "Users can view their own team memberships"
ON public.team_memberships FOR SELECT
USING (user_id = auth.uid());

-- Policies for manager teams
CREATE POLICY "Owners and admins can manage manager assignments"
ON public.manager_teams FOR ALL
USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Managers can view their own assignments"
ON public.manager_teams FOR SELECT
USING (manager_id = auth.uid());

-- Policies for content assignments
CREATE POLICY "Owners and admins can manage all content assignments"
ON public.content_assignments FOR ALL
USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Managers can manage assignments for their teams"
ON public.content_assignments FOR ALL
USING (
  assignment_type = 'team' AND 
  public.can_manage_team(auth.uid(), team_id)
);

CREATE POLICY "Users can view their content assignments"
ON public.content_assignments FOR SELECT
USING (
  user_id = auth.uid() OR
  (assignment_type = 'team' AND EXISTS (
    SELECT 1 FROM public.team_memberships 
    WHERE user_id = auth.uid() AND team_id = content_assignments.team_id
  ))
);

-- Recreate policies for existing tables with new role system

-- Courses policies
CREATE POLICY "Owners and admins can manage all courses"
ON public.courses FOR ALL
USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Everyone can view published courses"
ON public.courses FOR SELECT
USING (status = 'published');

CREATE POLICY "Instructors can manage their courses"
ON public.courses FOR ALL
USING (instructor_id = auth.uid());

-- Modules policies
CREATE POLICY "Owners and admins can manage all modules"
ON public.modules FOR ALL
USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Everyone can view modules for published courses"
ON public.modules FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.courses 
  WHERE id = modules.course_id AND status = 'published'
));

CREATE POLICY "Instructors can manage modules for their courses"
ON public.modules FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.courses 
  WHERE id = modules.course_id AND instructor_id = auth.uid()
));

-- Assessments policies
CREATE POLICY "Owners and admins can manage all assessments"
ON public.assessments FOR ALL
USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Enrolled users can view assessments"
ON public.assessments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.enrollments 
  WHERE course_id = assessments.course_id AND user_id = auth.uid()
));

CREATE POLICY "Instructors can manage assessments for their courses"
ON public.assessments FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.courses 
  WHERE id = assessments.course_id AND instructor_id = auth.uid()
));

-- Virtual classes policies
CREATE POLICY "Owners and admins can manage all virtual classes"
ON public.virtual_classes FOR ALL
USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Instructors can manage their virtual classes"
ON public.virtual_classes FOR ALL
USING (instructor_id = auth.uid());

CREATE POLICY "Users can view virtual classes for enrolled courses"
ON public.virtual_classes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE course_id = virtual_classes.course_id AND user_id = auth.uid()
  ) OR 
  instructor_id = auth.uid() OR 
  public.is_owner_or_admin(auth.uid())
);

-- Class attendees policies
CREATE POLICY "Owners and admins can manage all attendance records"
ON public.class_attendees FOR ALL
USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Instructors can view attendance for their classes"
ON public.class_attendees FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.virtual_classes 
  WHERE id = class_attendees.class_id AND instructor_id = auth.uid()
));

CREATE POLICY "Users can create their own attendance records"
ON public.class_attendees FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own attendance records"
ON public.class_attendees FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can view their own class attendance"
ON public.class_attendees FOR SELECT
USING (user_id = auth.uid());

-- Forums policies
CREATE POLICY "Instructors and admins can manage forums"
ON public.forums FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = forums.course_id AND instructor_id = auth.uid()
  ) OR 
  public.is_owner_or_admin(auth.uid())
);

CREATE POLICY "Users can view forums for enrolled courses"
ON public.forums FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE course_id = forums.course_id AND user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = forums.course_id AND instructor_id = auth.uid()
  ) OR 
  public.is_owner_or_admin(auth.uid())
);

-- Question banks policies
CREATE POLICY "Everyone can view question banks"
ON public.question_banks FOR SELECT
USING (true);

CREATE POLICY "Instructors and admins can manage question banks"
ON public.question_banks FOR ALL
USING (
  public.get_user_role(auth.uid()) IN ('owner', 'admin') OR
  public.get_user_role(auth.uid()) = 'manager'
);

-- Questions policies
CREATE POLICY "Owners and admins can manage all questions"
ON public.questions FOR ALL
USING (public.is_owner_or_admin(auth.uid()));

CREATE POLICY "Instructors can manage questions for their course assessments"
ON public.questions FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.assessments 
  JOIN public.courses ON assessments.course_id = courses.id
  WHERE assessments.id = questions.assessment_id AND courses.instructor_id = auth.uid()
));

CREATE POLICY "Users can view questions for assessments they can access"
ON public.questions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.assessments 
  JOIN public.enrollments ON assessments.course_id = enrollments.course_id
  WHERE assessments.id = questions.assessment_id AND enrollments.user_id = auth.uid()
));

-- Update profiles policy to allow role management
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  -- Users can update their own profile but not change role
  (auth.uid() = user_id AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())) OR
  -- Owners can change any role
  (public.get_user_role(auth.uid()) = 'owner') OR
  -- Admins can assign manager/learner roles but not owner/admin
  (public.get_user_role(auth.uid()) = 'admin' AND role IN ('manager', 'learner'))
);