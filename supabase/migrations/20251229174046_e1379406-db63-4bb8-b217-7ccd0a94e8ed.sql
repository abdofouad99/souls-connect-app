-- إضافة عمود user_id إلى جدول sponsorship_requests
ALTER TABLE public.sponsorship_requests 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- إضافة فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_sponsorship_requests_user_id ON sponsorship_requests(user_id);

-- إضافة فهارس إضافية للأداء
CREATE INDEX IF NOT EXISTS idx_sponsorship_requests_admin_status ON sponsorship_requests(admin_status);
CREATE INDEX IF NOT EXISTS idx_sponsorship_requests_sponsor_phone ON sponsorship_requests(sponsor_phone);

-- سياسة تمكن المستخدمين من رؤية طلباتهم الخاصة
CREATE POLICY "Users can view their own sponsorship requests"
ON public.sponsorship_requests
FOR SELECT
USING (auth.uid() = user_id);

-- سياسة تمكن المستخدمين المسجلين من إنشاء طلبات مع user_id الخاص بهم
DROP POLICY IF EXISTS "Anyone can create sponsorship requests" ON public.sponsorship_requests;

CREATE POLICY "Authenticated users can create sponsorship requests with their user_id"
ON public.sponsorship_requests
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) 
  OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);