-- Reconcile legacy camelCase user_profiles column naming with the
-- snake_case convention used by the current app and Prisma schema.
--
-- Some environments already have "cv_state" from the canonical
-- migration, while older databases still expose "cvState". The app's
-- Supabase queries expect "cv_state", so LinkedIn profile imports fail
-- until the table shape is normalized.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'cvState'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'cv_state'
  ) THEN
    EXECUTE 'ALTER TABLE "user_profiles" RENAME COLUMN "cvState" TO "cv_state"';
  END IF;
END $$;
