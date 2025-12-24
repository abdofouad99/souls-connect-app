-- Add policies to explicitly deny anonymous access to sensitive tables

-- Profiles table - deny anonymous access
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Sponsors table - deny anonymous access  
CREATE POLICY "Deny anonymous access to sponsors"
ON public.sponsors
FOR SELECT
TO anon
USING (false);

-- Deposit receipt requests - deny anonymous access
CREATE POLICY "Deny anonymous access to deposit_receipt_requests"
ON public.deposit_receipt_requests
FOR SELECT
TO anon
USING (false);

-- Receipts table - deny anonymous access
CREATE POLICY "Deny anonymous access to receipts"
ON public.receipts
FOR SELECT
TO anon
USING (false);

-- Sponsorships table - deny anonymous access
CREATE POLICY "Deny anonymous access to sponsorships"
ON public.sponsorships
FOR SELECT
TO anon
USING (false);

-- User roles table - deny anonymous access
CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);