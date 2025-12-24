-- إصلاح أمان تخزين deposit-receipts

-- 1. حذف السياسات القديمة غير الآمنة
DROP POLICY IF EXISTS "Anyone can upload deposit receipts" ON storage.objects;
DROP POLICY IF EXISTS "Deposit receipts are publicly accessible" ON storage.objects;

-- 2. جعل الـ bucket خاص
UPDATE storage.buckets
SET public = false
WHERE id = 'deposit-receipts';

-- 3. إنشاء سياسة رفع للمستخدمين المسجلين فقط
CREATE POLICY "Authenticated users can upload deposit receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'deposit-receipts' AND
  auth.uid() IS NOT NULL
);

-- 4. إنشاء سياسة عرض للمسؤولين والموظفين فقط
CREATE POLICY "Admin and staff can view deposit receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'deposit-receipts' AND
  is_admin_or_staff(auth.uid())
);

-- 5. إنشاء سياسة حذف للمسؤولين فقط
CREATE POLICY "Admin and staff can delete deposit receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'deposit-receipts' AND
  is_admin_or_staff(auth.uid())
);