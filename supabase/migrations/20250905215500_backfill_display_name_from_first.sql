-- Backfill display_name from first_name (or first token of full_name) where display_name is null
UPDATE public.profiles
SET display_name = COALESCE(first_name, split_part(full_name,' ',1))
WHERE (display_name IS NULL OR display_name = '')
  AND (first_name IS NOT NULL OR full_name IS NOT NULL);