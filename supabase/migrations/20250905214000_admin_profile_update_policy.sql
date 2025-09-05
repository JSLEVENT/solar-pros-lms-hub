-- Allow admins & owners to update any profile (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins can update any profile'
  ) THEN
    CREATE POLICY "Admins can update any profile" ON public.profiles
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = auth.uid() AND p.role IN ('admin','owner')
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = auth.uid() AND p.role IN ('admin','owner')
        )
      );
  END IF;
END$$;