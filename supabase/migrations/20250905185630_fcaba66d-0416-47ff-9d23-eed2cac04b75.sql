-- Add analytics tracking system
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add audit logs for compliance
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add notifications system
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add course content/media management
CREATE TABLE public.course_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL, -- video, pdf, document, scorm, etc
  content_url TEXT,
  file_size BIGINT,
  duration_seconds INTEGER,
  order_index INTEGER DEFAULT 0,
  is_downloadable BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add question banks for assessments
CREATE TABLE public.question_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link questions to question banks
ALTER TABLE questions ADD COLUMN question_bank_id UUID REFERENCES question_banks(id);

-- Add certificate templates
CREATE TABLE public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_url TEXT,
  background_url TEXT,
  fields JSONB, -- positions and styles for dynamic fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add certificate expiry tracking
ALTER TABLE certificates ADD COLUMN template_id UUID REFERENCES certificate_templates(id);
ALTER TABLE certificates ADD COLUMN status TEXT DEFAULT 'active';

-- Add webinar/virtual class enhancements
ALTER TABLE virtual_classes ADD COLUMN recording_url TEXT;
ALTER TABLE virtual_classes ADD COLUMN external_meeting_id TEXT;
ALTER TABLE virtual_classes ADD COLUMN platform TEXT DEFAULT 'zoom'; -- zoom, teams, webex

-- Add course pricing and payment tracking
ALTER TABLE courses ADD COLUMN is_paid BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN stripe_price_id TEXT;

-- Add payment records
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  amount INTEGER, -- amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add organization/tenant support for custom portals
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  settings JSONB,
  branding JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link users to organizations
ALTER TABLE profiles ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Enable RLS on new tables
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics
CREATE POLICY "Users can view their own analytics" ON analytics
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert analytics" ON analytics
FOR INSERT WITH CHECK (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for course content
CREATE POLICY "Everyone can view course content" ON course_content
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_content.course_id 
    AND courses.status = 'published'
  )
);

CREATE POLICY "Instructors can manage content for their courses" ON course_content
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_content.course_id 
    AND courses.instructor_id = auth.uid()
  )
);

-- RLS Policies for question banks
CREATE POLICY "Everyone can view question banks" ON question_banks
FOR SELECT USING (true);

CREATE POLICY "Instructors and admins can manage question banks" ON question_banks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('instructor', 'admin')
  )
);

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON payments
FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for organizations
CREATE POLICY "Users can view their organization" ON organizations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.organization_id = organizations.id
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_course_content_updated_at
BEFORE UPDATE ON course_content
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_banks_updated_at
BEFORE UPDATE ON question_banks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default organization
INSERT INTO organizations (name, domain, settings, branding)
VALUES (
  'Solar Pros Hub',
  'solarpros.hub',
  '{"features": ["analytics", "certificates", "forums", "webinars"]}',
  '{"primary_color": "#D32F2F", "secondary_color": "#000000", "logo_url": null}'
);

-- Insert demo certificate template
INSERT INTO certificate_templates (name, fields)
VALUES (
  'Default Solar Certificate',
  '{
    "title": {"x": 50, "y": 30, "fontSize": 24, "color": "#D32F2F"},
    "name": {"x": 50, "y": 50, "fontSize": 20, "color": "#000000"},
    "course": {"x": 50, "y": 60, "fontSize": 16, "color": "#000000"},
    "date": {"x": 50, "y": 70, "fontSize": 14, "color": "#666666"}
  }'
);

-- Insert demo question banks
INSERT INTO question_banks (title, description, category, created_by)
SELECT 
  'Solar Fundamentals Question Bank',
  'Basic questions about solar energy principles',
  'Solar Basics',
  id
FROM auth.users 
LIMIT 1;