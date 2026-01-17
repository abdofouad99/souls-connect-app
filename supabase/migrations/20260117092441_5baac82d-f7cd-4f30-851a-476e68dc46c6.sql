-- 1. إنشاء جدول الحسابات المحمية
CREATE TABLE public.protected_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  reason TEXT DEFAULT 'مدير رئيسي محمي',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.protected_users ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة للمديرين
CREATE POLICY "Admins can view protected users"
ON public.protected_users
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- سياسة الإدارة - فقط المستخدم المحمي نفسه يمكنه إزالة نفسه
CREATE POLICY "Only protected user can manage their protection"
ON public.protected_users
FOR ALL
USING (auth.uid() = user_id);

-- 2. دالة للتحقق من الحماية
CREATE OR REPLACE FUNCTION public.is_protected_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM protected_users WHERE user_id = _user_id
  )
$$;

-- 3. إضافة البريد المحمي
INSERT INTO public.protected_users (user_id, email, reason)
SELECT user_id, 'abdofouad9999999@gmail.com', 'المدير الرئيسي - لا يمكن حذفه أو تعديل صلاحياته'
FROM public.profiles 
WHERE email = 'abdofouad9999999@gmail.com';

-- 4. حذف السياسة القديمة وإنشاء سياسة جديدة لحماية الأدوار
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can manage non-protected roles"
ON public.user_roles
FOR ALL
USING (
  CASE 
    WHEN is_protected_user(user_roles.user_id)
    THEN auth.uid() = user_roles.user_id
    ELSE has_role(auth.uid(), 'admin')
  END
)
WITH CHECK (
  CASE 
    WHEN is_protected_user(user_roles.user_id)
    THEN auth.uid() = user_roles.user_id
    ELSE has_role(auth.uid(), 'admin')
  END
);

-- 5. تحديث سياسة profiles للحماية
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile with protection"
ON public.profiles
FOR UPDATE
USING (
  CASE 
    WHEN is_protected_user(profiles.user_id)
    THEN auth.uid() = profiles.user_id
    ELSE auth.uid() = profiles.user_id OR has_role(auth.uid(), 'admin')
  END
)
WITH CHECK (
  CASE 
    WHEN is_protected_user(profiles.user_id)
    THEN auth.uid() = profiles.user_id
    ELSE auth.uid() = profiles.user_id OR has_role(auth.uid(), 'admin')
  END
);