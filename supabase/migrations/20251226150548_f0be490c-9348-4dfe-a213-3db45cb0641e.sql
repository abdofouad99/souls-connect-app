-- Make sponsor_id nullable since approved requests may not have a linked sponsor record
ALTER TABLE public.sponsorships 
ALTER COLUMN sponsor_id DROP NOT NULL;