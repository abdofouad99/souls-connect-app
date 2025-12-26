-- Add UNIQUE constraint on request_id to prevent duplicate sponsorships for same request
ALTER TABLE public.sponsorships 
ADD CONSTRAINT sponsorships_request_id_unique UNIQUE (request_id);