-- تحديث سياسة INSERT لجدول sponsors لمنع إنشاء سجلات يتيمة

-- حذف السياسة الحالية
DROP POLICY IF EXISTS "Authenticated users can create their own sponsor record" ON public.sponsors;

-- إنشاء سياسة جديدة تتطلب أن يكون user_id مطابقاً لمعرف المستخدم الحالي دائماً
CREATE POLICY "Authenticated users can create their own sponsor record" 
ON public.sponsors 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_id = auth.uid()
);