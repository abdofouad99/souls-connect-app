-- =====================================================
-- COMPREHENSIVE 360° FIX MIGRATION
-- =====================================================

-- =====================================================
-- A) BACKFILL: Create missing sponsorships for approved requests
-- =====================================================

-- First generate receipt numbers for missing sponsorships
INSERT INTO sponsorships (
  request_id,
  orphan_id,
  sponsor_id,
  sponsor_full_name,
  sponsor_email,
  sponsor_phone,
  sponsor_country,
  type,
  monthly_amount,
  payment_method,
  transfer_receipt_image,
  cash_receipt_image,
  cash_receipt_number,
  cash_receipt_date,
  approved_at,
  approved_by,
  receipt_number,
  status,
  start_date
)
SELECT 
  sr.id as request_id,
  sr.orphan_id,
  (SELECT s.id FROM sponsors s WHERE s.email = sr.sponsor_email LIMIT 1) as sponsor_id,
  sr.sponsor_full_name,
  sr.sponsor_email,
  sr.sponsor_phone,
  sr.sponsor_country,
  sr.sponsorship_type as type,
  sr.amount as monthly_amount,
  sr.payment_method,
  sr.transfer_receipt_image,
  sr.cash_receipt_image,
  sr.cash_receipt_number,
  sr.cash_receipt_date,
  sr.approved_at,
  sr.approved_by,
  'RCP-' || TO_CHAR(COALESCE(sr.approved_at, NOW()), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') as receipt_number,
  'active' as status,
  COALESCE(sr.approved_at::date, CURRENT_DATE) as start_date
FROM sponsorship_requests sr
WHERE sr.admin_status = 'approved'
AND NOT EXISTS (
  SELECT 1 FROM sponsorships s WHERE s.request_id = sr.id
)
ON CONFLICT (request_id) DO NOTHING;

-- =====================================================
-- B) CREATE ORPHAN STATUS SYNC FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.recalculate_orphan_status(_orphan_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  required_amount numeric;
  active_sum numeric;
  new_status text;
BEGIN
  -- Get orphan's required monthly amount
  SELECT monthly_amount INTO required_amount
  FROM orphans WHERE id = _orphan_id;
  
  IF required_amount IS NULL THEN
    RETURN 'orphan_not_found';
  END IF;
  
  -- Calculate sum of active sponsorships
  SELECT COALESCE(SUM(monthly_amount), 0) INTO active_sum
  FROM sponsorships
  WHERE orphan_id = _orphan_id AND status = 'active';
  
  -- Determine new status
  IF active_sum >= required_amount THEN
    new_status := 'fully_sponsored';
  ELSIF active_sum > 0 THEN
    new_status := 'partially_sponsored';
  ELSE
    new_status := 'available';
  END IF;
  
  -- Update orphan status
  UPDATE orphans
  SET status = new_status, updated_at = now()
  WHERE id = _orphan_id AND status IS DISTINCT FROM new_status;
  
  RETURN new_status;
END;
$$;

-- =====================================================
-- B) CREATE TRIGGER FUNCTION FOR AUTOMATIC STATUS SYNC
-- =====================================================

CREATE OR REPLACE FUNCTION public.trigger_recalculate_orphan_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT or UPDATE: recalculate for the new orphan_id
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM recalculate_orphan_status(NEW.orphan_id);
    
    -- If orphan_id changed in UPDATE, also recalculate for old orphan
    IF TG_OP = 'UPDATE' AND OLD.orphan_id IS DISTINCT FROM NEW.orphan_id THEN
      PERFORM recalculate_orphan_status(OLD.orphan_id);
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- On DELETE: recalculate for the old orphan_id
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_orphan_status(OLD.orphan_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_sponsorship_orphan_status ON sponsorships;

CREATE TRIGGER trigger_sponsorship_orphan_status
AFTER INSERT OR UPDATE OF monthly_amount, status, orphan_id OR DELETE
ON sponsorships
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_orphan_status();

-- =====================================================
-- B) BACKFILL: Fix all orphan statuses now
-- =====================================================

-- Recalculate status for all orphans that have sponsorships
DO $$
DECLARE
  orphan_rec RECORD;
BEGIN
  FOR orphan_rec IN 
    SELECT DISTINCT o.id 
    FROM orphans o
    LEFT JOIN sponsorships s ON s.orphan_id = o.id
  LOOP
    PERFORM recalculate_orphan_status(orphan_rec.id);
  END LOOP;
END;
$$;

-- =====================================================
-- C) SYNC CASH RECEIPT IMAGE FROM REQUESTS TO SPONSORSHIPS
-- =====================================================

UPDATE sponsorships s
SET 
  cash_receipt_image = sr.cash_receipt_image,
  cash_receipt_number = sr.cash_receipt_number,
  cash_receipt_date = sr.cash_receipt_date,
  updated_at = now()
FROM sponsorship_requests sr
WHERE s.request_id = sr.id
AND sr.cash_receipt_image IS NOT NULL
AND s.cash_receipt_image IS NULL;

-- =====================================================
-- D) FIX DUPLICATE SPONSORS AND ADD UNIQUE CONSTRAINT
-- =====================================================

-- For user 08b5d231-2e54-4cfa-a2ef-526296840553 (3 duplicates):
-- Keep the one with most recent updated_at (e98b707b-1f18-431a-8510-0214b306d33b)
-- First, update sponsorships to point to the kept sponsor
UPDATE sponsorships 
SET sponsor_id = 'e98b707b-1f18-431a-8510-0214b306d33b'
WHERE sponsor_id IN ('ddcecd9d-9ffc-44b5-bcfb-3fb4dc994874', 'cab766e0-34df-4648-8adc-e26aabf373ee');

-- Delete duplicate sponsors
DELETE FROM sponsors 
WHERE id IN ('ddcecd9d-9ffc-44b5-bcfb-3fb4dc994874', 'cab766e0-34df-4648-8adc-e26aabf373ee');

-- For user 300feff1-cb77-431d-8225-8a9c44212558 (2 duplicates):
-- Keep the one with most recent updated_at (455ca386-2921-40b6-b035-fbb9a37569e2)
UPDATE sponsorships 
SET sponsor_id = '455ca386-2921-40b6-b035-fbb9a37569e2'
WHERE sponsor_id = 'ceaca081-902d-487b-95d7-1f469ac9ac5c';

DELETE FROM sponsors 
WHERE id = 'ceaca081-902d-487b-95d7-1f469ac9ac5c';

-- Now add the UNIQUE constraint
ALTER TABLE sponsors 
ADD CONSTRAINT sponsors_user_id_unique UNIQUE(user_id);

-- =====================================================
-- E) ADD PERFORMANCE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_deposit_requests_user_id 
ON public.deposit_receipt_requests(user_id);

-- Verify receipts.sponsorship_id has index (it should via FK)
CREATE INDEX IF NOT EXISTS idx_receipts_sponsorship_id 
ON public.receipts(sponsorship_id);

-- Additional helpful indexes
CREATE INDEX IF NOT EXISTS idx_sponsorships_orphan_id_status 
ON public.sponsorships(orphan_id, status);

CREATE INDEX IF NOT EXISTS idx_sponsorships_request_id 
ON public.sponsorships(request_id);