-- Create missing tables for learning plans functionality

-- Content assets table for learning materials
CREATE TABLE public.content_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL, -- 'video', 'document', 'interactive', etc.
  content_url TEXT,
  duration_minutes INTEGER,
  file_size BIGINT,
  thumbnail_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Learning plans table for structured learning paths
CREATE TABLE public.learning_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Learning plan items table for plan contents
CREATE TABLE public.learning_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learning_plan_id UUID NOT NULL REFERENCES public.learning_plans(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'asset', 'course'
  asset_id UUID REFERENCES public.content_assets(id),
  course_id UUID REFERENCES public.courses(id),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plan_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_assets
CREATE POLICY "Everyone can view content assets"
ON public.content_assets FOR SELECT
USING (true);

CREATE POLICY "Owners and admins can manage content assets"
ON public.content_assets FOR ALL
USING (is_owner_or_admin(auth.uid()));

-- RLS policies for learning_plans
CREATE POLICY "Everyone can view learning plans"
ON public.learning_plans FOR SELECT
USING (true);

CREATE POLICY "Owners and admins can manage learning plans"
ON public.learning_plans FOR ALL
USING (is_owner_or_admin(auth.uid()));

-- RLS policies for learning_plan_items
CREATE POLICY "Everyone can view learning plan items"
ON public.learning_plan_items FOR SELECT
USING (true);

CREATE POLICY "Owners and admins can manage learning plan items"
ON public.learning_plan_items FOR ALL
USING (is_owner_or_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_content_assets_updated_at
BEFORE UPDATE ON public.content_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_plans_updated_at
BEFORE UPDATE ON public.learning_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();