-- Add explicit UPDATE policy for admin/staff on sponsorship_requests
CREATE POLICY "Admin and staff can update sponsorship requests"
ON public.sponsorship_requests
FOR UPDATE
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));