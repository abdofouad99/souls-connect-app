-- (1) إنشاء Trigger Function لمزامنة سند القبض
CREATE OR REPLACE FUNCTION public.sync_cash_receipt_to_sponsorship()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- فقط عند الاعتماد
  IF NEW.admin_status = 'approved' THEN
    -- التحقق من تغيّر أي حقل مهم
    IF (NEW.cash_receipt_image IS DISTINCT FROM OLD.cash_receipt_image) OR
       (NEW.cash_receipt_number IS DISTINCT FROM OLD.cash_receipt_number) OR
       (NEW.cash_receipt_date IS DISTINCT FROM OLD.cash_receipt_date) OR
       (NEW.approved_at IS DISTINCT FROM OLD.approved_at) OR
       (NEW.approved_by IS DISTINCT FROM OLD.approved_by) THEN
      
      -- تحديث sponsorship المرتبط
      UPDATE public.sponsorships
      SET 
        cash_receipt_image = NEW.cash_receipt_image,
        cash_receipt_number = NEW.cash_receipt_number,
        cash_receipt_date = NEW.cash_receipt_date,
        approved_at = NEW.approved_at,
        approved_by = NEW.approved_by,
        updated_at = now()
      WHERE request_id = NEW.id;
      
      -- لا نرمي خطأ إذا لم يتم العثور على sponsorship
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء الـ Trigger
DROP TRIGGER IF EXISTS trigger_sync_cash_receipt_to_sponsorship ON public.sponsorship_requests;

CREATE TRIGGER trigger_sync_cash_receipt_to_sponsorship
AFTER UPDATE ON public.sponsorship_requests
FOR EACH ROW
EXECUTE FUNCTION public.sync_cash_receipt_to_sponsorship();

-- (2) إزالة UNIQUE المكرر (الاحتفاظ بـ sponsorships_request_id_key فقط)
ALTER TABLE public.sponsorships 
DROP CONSTRAINT IF EXISTS sponsorships_request_id_unique;