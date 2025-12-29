-- 1) حذف السياسة القديمة role=public على cash-receipts
DROP POLICY IF EXISTS "Admin can view cash receipts" ON storage.objects;

-- 2) إضافة سياسة جديدة: الكفيل يرى سند القبض المرتبط بطلبه المعتمد
CREATE POLICY "Sponsors can read cash receipts linked to their approved requests"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'cash-receipts'
  AND EXISTS (
    SELECT 1
    FROM public.sponsorship_requests r
    WHERE r.user_id = (SELECT auth.uid())
      AND r.admin_status = 'approved'
      AND r.cash_receipt_image = storage.objects.name
  )
);