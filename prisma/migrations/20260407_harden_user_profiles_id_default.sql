-- Fix: user_profiles was introduced without a database-level id default.
-- Direct Supabase upserts rely on either an explicit id or a DB default,
-- so keep the table aligned with the standard text-id convention.

ALTER TABLE "user_profiles"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
