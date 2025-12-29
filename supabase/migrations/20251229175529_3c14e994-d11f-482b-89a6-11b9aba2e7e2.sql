-- First, drop the existing constraint that was added before migration
ALTER TABLE public.orphans DROP CONSTRAINT IF EXISTS orphans_status_check;

-- Now migrate ALL old values
UPDATE public.orphans SET status = 'fully_sponsored' WHERE status IN ('full', 'sponsored');
UPDATE public.orphans SET status = 'partially_sponsored' WHERE status = 'partial';

-- Now add the constraint after migration is complete
ALTER TABLE public.orphans 
ADD CONSTRAINT orphans_status_check 
CHECK (status IN ('available', 'partially_sponsored', 'fully_sponsored', 'inactive'));