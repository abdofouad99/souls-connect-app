-- إصلاح سياسات RLS لجدول sponsors لحماية بيانات الكفلاء

-- حذف السياسات الحالية
DROP POLICY IF EXISTS "Admin and staff can view all sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Admin can manage sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Anyone can create sponsor" ON public.sponsors;
DROP POLICY IF EXISTS "Sponsors can view their own data" ON public.sponsors;

-- إنشاء سياسات جديدة آمنة

-- سياسة للسماح للمشرفين والموظفين بعرض جميع الكفلاء
CREATE POLICY "Admin and staff can view all sponsors" 
ON public.sponsors 
FOR SELECT 
USING (is_admin_or_staff(auth.uid()));

-- سياسة للسماح للمشرفين بإدارة الكفلاء
CREATE POLICY "Admin can manage sponsors" 
ON public.sponsors 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- سياسة للسماح للكفلاء بعرض بياناتهم الخاصة فقط
CREATE POLICY "Sponsors can view their own data" 
ON public.sponsors 
FOR SELECT 
USING (auth.uid() = user_id);

-- سياسة للسماح للمستخدمين المصادق عليهم فقط بإنشاء سجل كفيل
-- ويجب أن يكون user_id مطابقاً لمعرف المستخدم الحالي
CREATE POLICY "Authenticated users can create their own sponsor record" 
ON public.sponsors 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (user_id IS NULL OR user_id = auth.uid())
);

-- سياسة للسماح للكفلاء بتحديث بياناتهم الخاصة
CREATE POLICY "Sponsors can update their own data" 
ON public.sponsors 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);