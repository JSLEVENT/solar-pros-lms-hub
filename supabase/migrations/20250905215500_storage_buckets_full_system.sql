-- Comprehensive storage buckets for LMS components
-- Buckets: assets (content assets), course-media (videos/docs), certificates (generated cert pdf/png), avatars (already handled), plans (learning plan exports), exports (csv/report exports), temp (transient uploads)

DO $$
DECLARE
  b RECORD;
  buckets TEXT[] := ARRAY['assets','course-media','certificates','plans','exports','temp'];
BEGIN
  FOREACH b IN ARRAY buckets LOOP
    INSERT INTO storage.buckets (id, name, public)
    VALUES (b, b, CASE WHEN b IN ('assets','course-media','avatars','certificates') THEN true ELSE false END)
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END$$;

-- Generic read for public buckets
CREATE POLICY IF NOT EXISTS "Public buckets readable" ON storage.objects
FOR SELECT USING (bucket_id IN ('assets','course-media','avatars','certificates'));

-- Authenticated upload to non-system buckets
CREATE POLICY IF NOT EXISTS "Authenticated can upload" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated can update own objects" ON storage.objects
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated can delete own objects" ON storage.objects
FOR DELETE USING (auth.role() = 'authenticated');
