-- Create notifications log table
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Only admin and staff can view notification logs
CREATE POLICY "Admin and staff can view notification logs"
ON public.notification_logs
FOR SELECT
USING (is_admin_or_staff(auth.uid()));

-- Only admin and staff can manage notification logs
CREATE POLICY "Admin and staff can manage notification logs"
ON public.notification_logs
FOR ALL
USING (is_admin_or_staff(auth.uid()));

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to notification_logs"
ON public.notification_logs
FOR SELECT
USING (false);

-- Create index for faster queries
CREATE INDEX idx_notification_logs_created_at ON public.notification_logs(created_at DESC);
CREATE INDEX idx_notification_logs_type ON public.notification_logs(notification_type);