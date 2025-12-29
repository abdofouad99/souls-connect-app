-- =============================================
-- D) Secure deposit-receipts bucket
-- =============================================

-- Make bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'deposit-receipts';

-- Drop all existing policies for deposit-receipts
DROP POLICY IF EXISTS "Anyone can view deposit receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view deposit receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload deposit receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admin can manage deposit receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admin and staff can view deposit receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admin and staff can upload deposit receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload their deposit receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admin and staff can update deposit receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admin and staff can delete deposit receipts" ON storage.objects;

-- Create secure policies for deposit-receipts bucket

-- Only admin/staff can view deposit receipts
CREATE POLICY "Admin and staff can view deposit receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'deposit-receipts' 
  AND public.is_admin_or_staff(auth.uid())
);

-- Authenticated users can upload to deposit-receipts (for their own requests)
CREATE POLICY "Authenticated users can upload their deposit receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'deposit-receipts'
);

-- Only admin/staff can update deposit receipts
CREATE POLICY "Admin and staff can update deposit receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'deposit-receipts' 
  AND public.is_admin_or_staff(auth.uid())
);

-- Only admin/staff can delete deposit receipts
CREATE POLICY "Admin and staff can delete deposit receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'deposit-receipts' 
  AND public.is_admin_or_staff(auth.uid())
);

-- =============================================
-- E) Add UNIQUE constraint on receipts for upsert
-- =============================================
ALTER TABLE public.receipts 
DROP CONSTRAINT IF EXISTS receipts_sponsorship_id_key;

ALTER TABLE public.receipts 
ADD CONSTRAINT receipts_sponsorship_id_key UNIQUE (sponsorship_id);

-- =============================================
-- F) Fix RLS policies for sponsorship_requests user_id security
-- =============================================

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Authenticated users can create sponsorship requests with their user_id" ON public.sponsorship_requests;
DROP POLICY IF EXISTS "Anyone can create sponsorship requests" ON public.sponsorship_requests;
DROP POLICY IF EXISTS "Authenticated users can create sponsorship requests" ON public.sponsorship_requests;
DROP POLICY IF EXISTS "Anonymous users can create sponsorship requests without user_id" ON public.sponsorship_requests;

-- Policy for authenticated users: must use their own user_id
CREATE POLICY "Authenticated users can create sponsorship requests"
ON public.sponsorship_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy for anonymous users: user_id must be null
CREATE POLICY "Anonymous users can create sponsorship requests without user_id"
ON public.sponsorship_requests
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);