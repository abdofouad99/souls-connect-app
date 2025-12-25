-- Make deposit-receipts bucket public for admin access
UPDATE storage.buckets SET public = true WHERE id = 'deposit-receipts';