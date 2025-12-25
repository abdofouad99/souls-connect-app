-- Create sponsorship_requests table for pending sponsorships
CREATE TABLE public.sponsorship_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Sponsor info
  sponsor_full_name TEXT NOT NULL,
  sponsor_phone TEXT NOT NULL,
  sponsor_email TEXT,
  sponsor_country TEXT,
  
  -- Orphan reference
  orphan_id UUID NOT NULL REFERENCES public.orphans(id) ON DELETE CASCADE,
  
  -- Sponsorship details
  sponsorship_type TEXT NOT NULL CHECK (sponsorship_type IN ('monthly', 'yearly')),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'تحويل بنكي',
  
  -- Transfer receipt from sponsor (optional)
  transfer_receipt_image TEXT,
  
  -- Admin review fields
  admin_status TEXT NOT NULL DEFAULT 'pending' CHECK (admin_status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Cash receipt from admin (after approval)
  cash_receipt_image TEXT,
  cash_receipt_number TEXT,
  cash_receipt_date DATE
);

-- Enable RLS
ALTER TABLE public.sponsorship_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can create sponsorship requests (public form)
CREATE POLICY "Anyone can create sponsorship requests"
ON public.sponsorship_requests
FOR INSERT
WITH CHECK (true);

-- Admin and staff can view all requests
CREATE POLICY "Admin and staff can view all sponsorship requests"
ON public.sponsorship_requests
FOR SELECT
USING (is_admin_or_staff(auth.uid()));

-- Admin and staff can manage requests
CREATE POLICY "Admin and staff can manage sponsorship requests"
ON public.sponsorship_requests
FOR ALL
USING (is_admin_or_staff(auth.uid()));

-- Public can view their own approved requests by phone+name match (for lookup)
CREATE POLICY "Public can view approved requests by phone and name"
ON public.sponsorship_requests
FOR SELECT
USING (admin_status = 'approved');

-- Create trigger for updated_at
CREATE TRIGGER update_sponsorship_requests_updated_at
BEFORE UPDATE ON public.sponsorship_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for cash receipts (admin uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cash-receipts', 'cash-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for cash-receipts bucket
CREATE POLICY "Admin can upload cash receipts"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'cash-receipts' AND is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin can view cash receipts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cash-receipts' AND is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin can update cash receipts"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'cash-receipts' AND is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin can delete cash receipts"
ON storage.objects
FOR DELETE
USING (bucket_id = 'cash-receipts' AND is_admin_or_staff(auth.uid()));