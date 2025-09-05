-- Remove pricing and payment functionality from the LMS

-- Drop payment-related tables
DROP TABLE IF EXISTS public.payments CASCADE;

-- Remove pricing columns from courses table
ALTER TABLE public.courses 
DROP COLUMN IF EXISTS price,
DROP COLUMN IF EXISTS stripe_price_id,
DROP COLUMN IF EXISTS is_paid;

-- Remove any payment-related policies and constraints
-- (The above drops will handle this automatically)