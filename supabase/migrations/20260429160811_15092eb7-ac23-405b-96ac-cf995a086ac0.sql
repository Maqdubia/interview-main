CREATE TABLE public.email_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can subscribe
CREATE POLICY "anyone can subscribe"
ON public.email_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- No public SELECT/UPDATE/DELETE policies — keeps the list private by default.
CREATE INDEX idx_email_subscribers_created_at ON public.email_subscribers(created_at DESC);