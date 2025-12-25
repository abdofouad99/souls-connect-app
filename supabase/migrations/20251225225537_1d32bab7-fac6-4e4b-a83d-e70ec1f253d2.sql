-- Drop existing storage policies for cash-receipts if any (proper way)
DROP POLICY IF EXISTS "Admin can upload cash receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view cash receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update cash receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete cash receipts" ON storage.objects;

-- Create storage policies for cash-receipts bucket
CREATE POLICY "Admin can upload cash receipts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'cash-receipts' 
  AND is_admin_or_staff(auth.uid())
);

CREATE POLICY "Admin can view cash receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'cash-receipts' 
  AND is_admin_or_staff(auth.uid())
);

CREATE POLICY "Admin can update cash receipts"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'cash-receipts' 
  AND is_admin_or_staff(auth.uid())
);

CREATE POLICY "Admin can delete cash receipts"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'cash-receipts' 
  AND is_admin_or_staff(auth.uid())
);