-- Add archival / active flags and avatar storage bucket
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Simple index for filtering
CREATE INDEX IF NOT EXISTS teams_is_archived_idx ON public.teams (is_archived);
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON public.profiles (is_active);

-- Create public avatars bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars','avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow users to manage their own avatar objects
CREATE POLICY IF NOT EXISTS "Avatar objects are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Users can upload their avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can update their avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can delete their avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
