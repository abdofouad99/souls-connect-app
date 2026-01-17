# خطة حماية حساب المدير الرئيسي

## الهدف
حماية حساب `abdofouad9999999@gmail.com` بحيث لا يمكن لأي شخص:
- حذف حسابه
- تغيير دوره (role)
- تعديل بياناته

**إلا بموافقة صاحب الحساب نفسه فقط**

---

## الخطوات المطلوبة

### 1. إنشاء جدول للحسابات المحمية

```sql
CREATE TABLE protected_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  reason TEXT DEFAULT 'مدير رئيسي محمي',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. إضافة البريد المحمي

```sql
INSERT INTO protected_users (user_id, email, reason)
SELECT user_id, 'abdofouad9999999@gmail.com', 'المدير الرئيسي - لا يمكن حذفه أو تعديل صلاحياته'
FROM profiles 
WHERE email = 'abdofouad9999999@gmail.com';
```

### 3. تعديل سياسات RLS على جدول user_roles

**السياسة الحالية:**
```sql
-- المديرون يمكنهم إدارة جميع الأدوار
Admins can manage all roles: has_role(auth.uid(), 'admin')
```

**السياسة الجديدة:**
```sql
-- منع تعديل أو حذف أدوار الحسابات المحمية إلا من صاحب الحساب
CREATE POLICY "Protect super admin roles" ON user_roles
FOR ALL USING (
  -- إذا كان الحساب محمي
  CASE 
    WHEN EXISTS (SELECT 1 FROM protected_users WHERE protected_users.user_id = user_roles.user_id)
    THEN auth.uid() = user_roles.user_id  -- فقط صاحب الحساب
    ELSE has_role(auth.uid(), 'admin')    -- وإلا أي مدير
  END
);
```

### 4. تعديل سياسات RLS على جدول profiles

```sql
-- منع تعديل بيانات الحسابات المحمية من قبل الآخرين
CREATE POLICY "Protect super admin profiles" ON profiles
FOR UPDATE USING (
  CASE 
    WHEN EXISTS (SELECT 1 FROM protected_users WHERE protected_users.user_id = profiles.user_id)
    THEN auth.uid() = profiles.user_id
    ELSE auth.uid() = profiles.user_id OR has_role(auth.uid(), 'admin')
  END
);
```

### 5. تحديث واجهة المستخدم

تعديل `UsersManagement.tsx` لـ:
- عرض شارة "محمي" بجانب الحساب المحمي
- إخفاء أو تعطيل زر "تعديل الدور" للحسابات المحمية
- عرض رسالة توضيحية عند محاولة التعديل

### 6. إنشاء دالة للتحقق من الحماية

```sql
CREATE OR REPLACE FUNCTION is_protected_user(_user_id UUID)
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
```

---

## النتيجة النهائية

| العملية | المديرون الآخرون | صاحب الحساب المحمي |
|---------|------------------|-------------------|
| عرض الحساب | مسموح | مسموح |
| تعديل الدور | ممنوع | مسموح |
| حذف الحساب | ممنوع | مسموح |
| تعديل البيانات | ممنوع | مسموح |

---

## ملاحظات أمنية

1. الحماية تتم على مستوى قاعدة البيانات (RLS) - لا يمكن تجاوزها من الواجهة
2. حتى لو تم تعديل الكود، ستبقى الحماية فعالة
3. يمكن إضافة حسابات محمية أخرى مستقبلاً بسهولة

---

## الملفات التي سيتم تعديلها

1. **قاعدة البيانات**: إنشاء جدول وسياسات جديدة
2. `src/pages/admin/UsersManagement.tsx`: إضافة منطق عرض الحسابات المحمية
3. `src/integrations/supabase/types.ts`: سيتم تحديثه تلقائياً
