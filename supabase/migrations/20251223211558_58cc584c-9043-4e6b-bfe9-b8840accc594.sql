-- Create storage bucket for orphan photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'orphan-photos',
  'orphan-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Allow anyone to view orphan photos (public bucket)
CREATE POLICY "Anyone can view orphan photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'orphan-photos');

-- Allow admin and staff to upload orphan photos
CREATE POLICY "Admin and staff can upload orphan photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'orphan-photos' 
  AND public.is_admin_or_staff(auth.uid())
);

-- Allow admin and staff to update orphan photos
CREATE POLICY "Admin and staff can update orphan photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'orphan-photos' 
  AND public.is_admin_or_staff(auth.uid())
);

-- Allow admin and staff to delete orphan photos
CREATE POLICY "Admin and staff can delete orphan photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'orphan-photos' 
  AND public.is_admin_or_staff(auth.uid())
);