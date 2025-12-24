-- Drop the insecure policy that allows anyone to create sponsorships
DROP POLICY IF EXISTS "Anyone can create sponsorship" ON public.sponsorships;

-- Create a secure policy that only allows authenticated users to create sponsorships
CREATE POLICY "Authenticated users can create sponsorships"
ON public.sponsorships
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sponsors s
    WHERE s.id = sponsor_id AND s.user_id = auth.uid()
  )
);

-- Also fix the receipts table which has the same issue
DROP POLICY IF EXISTS "Anyone can create receipt" ON public.receipts;

-- Create a secure policy for receipts - only allow creation through sponsorship process
CREATE POLICY "Authenticated users can create receipts for their sponsorships"
ON public.receipts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sponsorships sp
    JOIN public.sponsors s ON s.id = sp.sponsor_id
    WHERE sp.id = sponsorship_id AND s.user_id = auth.uid()
  )
  OR is_admin_or_staff(auth.uid())
);