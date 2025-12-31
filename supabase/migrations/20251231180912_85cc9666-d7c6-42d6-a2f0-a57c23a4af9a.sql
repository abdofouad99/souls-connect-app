-- إزالة السياسة العامة الخطيرة التي تكشف بيانات الكفلاء للجميع
-- صفحة /receipt-lookup أصبحت محمية وتتطلب تسجيل دخول + مطابقة اسم الكفيل

DROP POLICY IF EXISTS "Public can view approved requests by phone and name" ON public.sponsorship_requests;