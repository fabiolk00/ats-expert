ALTER TABLE public.user_auth_identities
  ADD COLUMN IF NOT EXISTS signup_method TEXT NOT NULL DEFAULT 'unknown';

ALTER TABLE public.user_auth_identities
  DROP CONSTRAINT IF EXISTS user_auth_identities_signup_method_check;

ALTER TABLE public.user_auth_identities
  ADD CONSTRAINT user_auth_identities_signup_method_check
  CHECK (signup_method IN ('email', 'google', 'unknown'));

COMMENT ON COLUMN public.user_auth_identities.signup_method IS
  'Signup method inferred from Clerk user.created events: email, google, or unknown.';
