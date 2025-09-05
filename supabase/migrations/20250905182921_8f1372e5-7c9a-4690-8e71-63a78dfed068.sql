-- Add missing RLS policies for modules
CREATE POLICY "Everyone can view modules for published courses" ON public.modules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = modules.course_id AND courses.status = 'published'
  )
);

CREATE POLICY "Instructors can manage modules for their courses" ON public.modules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = modules.course_id AND courses.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all modules" ON public.modules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add missing RLS policies for assessments
CREATE POLICY "Enrolled users can view assessments" ON public.assessments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE enrollments.course_id = assessments.course_id 
    AND enrollments.user_id = auth.uid()
  )
);

CREATE POLICY "Instructors can manage assessments for their courses" ON public.assessments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = assessments.course_id AND courses.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all assessments" ON public.assessments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add missing RLS policies for questions
CREATE POLICY "Users can view questions for assessments they can access" ON public.questions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.assessments 
    JOIN public.enrollments ON assessments.course_id = enrollments.course_id
    WHERE assessments.id = questions.assessment_id 
    AND enrollments.user_id = auth.uid()
  )
);

CREATE POLICY "Instructors can manage questions for their course assessments" ON public.questions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.assessments 
    JOIN public.courses ON assessments.course_id = courses.id
    WHERE assessments.id = questions.assessment_id 
    AND courses.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all questions" ON public.questions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add missing RLS policies for forums
CREATE POLICY "Users can view forums for enrolled courses" ON public.forums
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE enrollments.course_id = forums.course_id 
    AND enrollments.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = forums.course_id AND courses.instructor_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Instructors and admins can manage forums" ON public.forums
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = forums.course_id AND courses.instructor_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add missing RLS policies for virtual_classes
CREATE POLICY "Users can view virtual classes for enrolled courses" ON public.virtual_classes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE enrollments.course_id = virtual_classes.course_id 
    AND enrollments.user_id = auth.uid()
  ) OR
  instructor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Instructors can manage their virtual classes" ON public.virtual_classes
FOR ALL USING (instructor_id = auth.uid());

CREATE POLICY "Admins can manage all virtual classes" ON public.virtual_classes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add missing RLS policies for class_attendees
CREATE POLICY "Users can view their own class attendance" ON public.class_attendees
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own attendance records" ON public.class_attendees
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own attendance records" ON public.class_attendees
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Instructors can view attendance for their classes" ON public.class_attendees
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.virtual_classes 
    WHERE virtual_classes.id = class_attendees.class_id 
    AND virtual_classes.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all attendance records" ON public.class_attendees
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);