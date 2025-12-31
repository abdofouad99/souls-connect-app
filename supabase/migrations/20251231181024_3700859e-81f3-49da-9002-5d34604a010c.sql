-- إزالة السياسة العامة وتقييد الوصول للمسجّلين فقط
DROP POLICY IF EXISTS "Anyone can view orphans" ON public.orphans;

-- السماح فقط للمستخدمين المسجّلين بعرض الأيتام
CREATE POLICY "Authenticated users can view orphans"
ON public.orphans
FOR SELECT
TO authenticated
USING (true);