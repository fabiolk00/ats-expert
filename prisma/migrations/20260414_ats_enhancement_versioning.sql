DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumtypid = 'public.cv_version_source'::regtype
      AND enumlabel = 'ats-enhancement'
  ) THEN
    ALTER TYPE public.cv_version_source ADD VALUE 'ats-enhancement';
  END IF;
END;
$$;
