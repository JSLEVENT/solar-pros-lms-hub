-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  duration TEXT,
  price DECIMAL(10,2),
  instructor_id UUID REFERENCES public.profiles(user_id),
  image_url TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create modules table
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_url TEXT,
  content_type TEXT CHECK (content_type IN ('video', 'pdf', 'scorm', 'text', 'quiz')),
  order_index INTEGER,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'expired')),
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- Create assessments table
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('quiz', 'exam', 'assignment', 'project')),
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
  options JSONB, -- For multiple choice options
  correct_answer JSONB,
  points INTEGER DEFAULT 1,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assessment_results table
CREATE TABLE public.assessment_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  passed BOOLEAN,
  answers JSONB,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  attempt_number INTEGER DEFAULT 1
);

-- Create certificates table
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_url TEXT,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  verification_code TEXT UNIQUE,
  UNIQUE(user_id, course_id)
);

-- Create forums table
CREATE TABLE public.forums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum_posts table
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_id UUID REFERENCES public.forums(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.forum_posts(id), -- For replies
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create virtual_classes table
CREATE TABLE public.virtual_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES public.profiles(user_id),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_url TEXT,
  meeting_id TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  max_participants INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_attendees table
CREATE TABLE public.class_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.virtual_classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(class_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_attendees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for courses
CREATE POLICY "Everyone can view published courses" ON public.courses
FOR SELECT USING (status = 'published');

CREATE POLICY "Instructors can manage their courses" ON public.courses
FOR ALL USING (instructor_id = auth.uid());

CREATE POLICY "Admins can manage all courses" ON public.courses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create RLS policies for enrollments
CREATE POLICY "Users can view their own enrollments" ON public.enrollments
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own enrollments" ON public.enrollments
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own enrollments" ON public.enrollments
FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for certificates
CREATE POLICY "Users can view their own certificates" ON public.certificates
FOR SELECT USING (user_id = auth.uid());

-- Create RLS policies for forum posts
CREATE POLICY "Users can view all forum posts" ON public.forum_posts
FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts" ON public.forum_posts
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own posts" ON public.forum_posts
FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for assessment results
CREATE POLICY "Users can view their own assessment results" ON public.assessment_results
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own assessment results" ON public.assessment_results
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modules_updated_at
BEFORE UPDATE ON public.modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at
BEFORE UPDATE ON public.forum_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();