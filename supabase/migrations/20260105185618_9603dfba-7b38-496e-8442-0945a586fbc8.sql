-- إنشاء جدول الحسابات البنكية
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  iban TEXT,
  beneficiary_name TEXT NOT NULL,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة: أي مستخدم مسجل يمكنه رؤية الحسابات النشطة
CREATE POLICY "Anyone can view active bank accounts"
ON public.bank_accounts
FOR SELECT
USING (is_active = true);

-- سياسة للإدارة: فقط الأدمن يمكنه التعديل
CREATE POLICY "Only admins can manage bank accounts"
ON public.bank_accounts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger لتحديث updated_at
CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- إدخال بيانات ابتدائية للحساب البنكي
INSERT INTO public.bank_accounts (bank_name, account_number, iban, beneficiary_name, notes, display_order)
VALUES 
  ('بنك الراجحي', '123456789', 'SA1234567890123456789012', 'جمعية الأقصى', 'الحساب الرئيسي للتبرعات', 1);