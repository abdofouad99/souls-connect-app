-- (1) تنظيف بيانات legacy في sponsorships.receipt_image_url
-- تحويل URLs الكاملة إلى paths فقط وإزالة query strings

UPDATE public.sponsorships
SET receipt_image_url = regexp_replace(
  regexp_replace(
    receipt_image_url,
    '^https?://[^/]+/storage/v1/object/public/deposit-receipts/',
    ''
  ),
  '\?.*$',
  ''
)
WHERE receipt_image_url LIKE 'http%';

-- (2) إضافة Indexes مفقودة لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_orphans_status ON public.orphans(status);
CREATE INDEX IF NOT EXISTS idx_sponsorships_orphan_id ON public.sponsorships(orphan_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_sponsor_id ON public.sponsorships(sponsor_id);