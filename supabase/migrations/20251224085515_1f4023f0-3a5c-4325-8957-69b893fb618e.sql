-- Add user_id column to track who created the request
ALTER TABLE public.deposit_receipt_requests 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop the insecure "Anyone can create" policy
DROP POLICY IF EXISTS "Anyone can create deposit receipt request" ON public.deposit_receipt_requests;

-- Create policy for authenticated users to create their own requests
CREATE POLICY "Authenticated users can create deposit requests"
ON public.deposit_receipt_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to view their own requests
CREATE POLICY "Users can view their own deposit requests"
ON public.deposit_receipt_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);