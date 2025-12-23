-- Create table for deposit receipt requests
CREATE TABLE public.deposit_receipt_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  deposit_amount NUMERIC NOT NULL,
  bank_method TEXT NOT NULL,
  receipt_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.deposit_receipt_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create a deposit receipt request (public form)
CREATE POLICY "Anyone can create deposit receipt request"
ON public.deposit_receipt_requests
FOR INSERT
WITH CHECK (true);

-- Admin and staff can view all requests
CREATE POLICY "Admin and staff can view all deposit requests"
ON public.deposit_receipt_requests
FOR SELECT
USING (is_admin_or_staff(auth.uid()));

-- Admin and staff can manage requests
CREATE POLICY "Admin and staff can manage deposit requests"
ON public.deposit_receipt_requests
FOR ALL
USING (is_admin_or_staff(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_deposit_receipt_requests_updated_at
BEFORE UPDATE ON public.deposit_receipt_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for deposit receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deposit-receipts', 'deposit-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for deposit receipts
CREATE POLICY "Anyone can upload deposit receipts"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'deposit-receipts');

CREATE POLICY "Deposit receipts are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'deposit-receipts');