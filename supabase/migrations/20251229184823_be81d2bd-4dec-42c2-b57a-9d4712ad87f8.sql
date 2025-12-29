-- ========================================
-- A) Migration: تحويل URL كامل إلى path فقط
-- ========================================

-- Helper function لاستخراج path من URL
CREATE OR REPLACE FUNCTION public.extract_storage_path(url_or_path TEXT, bucket_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  result TEXT;
  bucket_pattern TEXT;
BEGIN
  -- إذا NULL أو فارغ
  IF url_or_path IS NULL OR url_or_path = '' THEN
    RETURN url_or_path;
  END IF;
  
  result := url_or_path;
  
  -- إذا يبدأ بـ http (URL كامل)
  IF result LIKE 'http%' THEN
    -- بناء pattern للـ bucket
    bucket_pattern := '/' || bucket_name || '/';
    
    -- استخراج الجزء بعد bucket name
    IF position(bucket_pattern in result) > 0 THEN
      result := substring(result from position(bucket_pattern in result) + length(bucket_pattern));
    END IF;
    
    -- حذف query string (أي شيء بعد ?)
    IF position('?' in result) > 0 THEN
      result := substring(result from 1 for position('?' in result) - 1);
    END IF;
  END IF;
  
  -- إذا يبدأ بـ public/
  IF result LIKE 'public/%' THEN
    result := substring(result from 8); -- حذف 'public/'
  END IF;
  
  -- URL decode
  result := regexp_replace(result, '%20', ' ', 'g');
  result := regexp_replace(result, '%2F', '/', 'g');
  
  RETURN result;
END;
$$;

-- 1) deposit_receipt_requests.receipt_image_url (bucket: deposit-receipts)
UPDATE public.deposit_receipt_requests
SET receipt_image_url = public.extract_storage_path(receipt_image_url, 'deposit-receipts')
WHERE receipt_image_url IS NOT NULL 
  AND receipt_image_url != ''
  AND (receipt_image_url LIKE 'http%' OR receipt_image_url LIKE 'public/%');

-- 2) sponsorship_requests.transfer_receipt_image (bucket: deposit-receipts)
UPDATE public.sponsorship_requests
SET transfer_receipt_image = public.extract_storage_path(transfer_receipt_image, 'deposit-receipts')
WHERE transfer_receipt_image IS NOT NULL 
  AND transfer_receipt_image != ''
  AND (transfer_receipt_image LIKE 'http%' OR transfer_receipt_image LIKE 'public/%');

-- 3) sponsorships.transfer_receipt_image (bucket: deposit-receipts)
UPDATE public.sponsorships
SET transfer_receipt_image = public.extract_storage_path(transfer_receipt_image, 'deposit-receipts')
WHERE transfer_receipt_image IS NOT NULL 
  AND transfer_receipt_image != ''
  AND (transfer_receipt_image LIKE 'http%' OR transfer_receipt_image LIKE 'public/%');

-- 4) sponsorship_requests.cash_receipt_image (bucket: cash-receipts)
UPDATE public.sponsorship_requests
SET cash_receipt_image = public.extract_storage_path(cash_receipt_image, 'cash-receipts')
WHERE cash_receipt_image IS NOT NULL 
  AND cash_receipt_image != ''
  AND (cash_receipt_image LIKE 'http%' OR cash_receipt_image LIKE 'public/%');

-- 5) sponsorships.cash_receipt_image (bucket: cash-receipts)
UPDATE public.sponsorships
SET cash_receipt_image = public.extract_storage_path(cash_receipt_image, 'cash-receipts')
WHERE cash_receipt_image IS NOT NULL 
  AND cash_receipt_image != ''
  AND (cash_receipt_image LIKE 'http%' OR cash_receipt_image LIKE 'public/%');

-- حذف الدالة المساعدة بعد الانتهاء
DROP FUNCTION IF EXISTS public.extract_storage_path(TEXT, TEXT);

-- ========================================
-- C) تدقيق/تصحيح سياسات RLS على storage.objects
-- ========================================

-- حذف السياسات القديمة إن وجدت لإعادة إنشائها بشكل صحيح
DROP POLICY IF EXISTS "Admin and staff can view private bucket files" ON storage.objects;
DROP POLICY IF EXISTS "Admin and staff can upload to private buckets" ON storage.objects;
DROP POLICY IF EXISTS "Admin and staff can update private bucket files" ON storage.objects;
DROP POLICY IF EXISTS "Admin and staff can delete private bucket files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own transfer receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own uploaded files" ON storage.objects;

-- سياسة SELECT للـ Admin/Staff على buckets الخاصة
-- مطلوبة لـ createSignedUrl
CREATE POLICY "Admin and staff can view private bucket files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('deposit-receipts', 'cash-receipts')
  AND public.is_admin_or_staff(auth.uid())
);

-- سياسة INSERT للـ Admin/Staff
CREATE POLICY "Admin and staff can upload to private buckets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('deposit-receipts', 'cash-receipts')
  AND public.is_admin_or_staff(auth.uid())
);

-- سياسة UPDATE للـ Admin/Staff
CREATE POLICY "Admin and staff can update private bucket files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('deposit-receipts', 'cash-receipts')
  AND public.is_admin_or_staff(auth.uid())
);

-- سياسة DELETE للـ Admin/Staff
CREATE POLICY "Admin and staff can delete private bucket files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('deposit-receipts', 'cash-receipts')
  AND public.is_admin_or_staff(auth.uid())
);

-- سياسة للمستخدمين العاديين لرفع إيصالات التحويل الخاصة بهم
CREATE POLICY "Users can upload their own transfer receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'deposit-receipts'
  AND auth.uid() IS NOT NULL
);

-- سياسة للمستخدمين لعرض ملفاتهم الخاصة (اختياري - للتوافق)
CREATE POLICY "Users can view their own uploaded files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('deposit-receipts', 'cash-receipts')
  AND (
    public.is_admin_or_staff(auth.uid())
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);