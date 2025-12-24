-- Add receipt_image_url column to sponsorships table
ALTER TABLE public.sponsorships 
ADD COLUMN receipt_image_url TEXT;