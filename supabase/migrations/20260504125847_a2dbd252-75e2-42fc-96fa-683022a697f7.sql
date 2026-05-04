-- Add email format validation to email_subscribers
DROP POLICY IF EXISTS "anyone can subscribe" ON public.email_subscribers;

CREATE POLICY "anyone can subscribe with valid email"
ON public.email_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) <= 254
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND (source IS NULL OR length(source) <= 64)
);

-- Restrict EXECUTE on SECURITY DEFINER functions to only the postgres/service role.
-- handle_new_user is invoked by an auth trigger as table owner, so anon/authenticated do not need EXECUTE.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- update_updated_at_column is a trigger function; revoke direct execute as well.
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;