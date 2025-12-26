-- Add request_id column to sponsorships table to link to sponsorship_requests
ALTER TABLE public.sponsorships 
ADD COLUMN IF NOT EXISTS request_id uuid UNIQUE REFERENCES public.sponsorship_requests(id);

-- Add sponsor info columns directly to sponsorships (for approved requests)
ALTER TABLE public.sponsorships 
ADD COLUMN IF NOT EXISTS sponsor_full_name text,
ADD COLUMN IF NOT EXISTS sponsor_phone text,
ADD COLUMN IF NOT EXISTS sponsor_email text,
ADD COLUMN IF NOT EXISTS sponsor_country text,
ADD COLUMN IF NOT EXISTS transfer_receipt_image text,
ADD COLUMN IF NOT EXISTS cash_receipt_image text,
ADD COLUMN IF NOT EXISTS cash_receipt_number text,
ADD COLUMN IF NOT EXISTS cash_receipt_date date,
ADD COLUMN IF NOT EXISTS approved_at timestamptz,
ADD COLUMN IF NOT EXISTS approved_by uuid;