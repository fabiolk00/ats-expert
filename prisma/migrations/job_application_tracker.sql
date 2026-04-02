DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'job_application_status'
  ) THEN
    CREATE TYPE public.job_application_status AS ENUM (
      'entrevista',
      'aguardando',
      'sem_retorno',
      'negativa'
    );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.job_applications (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  company text NOT NULL,
  status public.job_application_status NOT NULL DEFAULT 'aguardando',
  salary text,
  location text,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  resume_version_label text NOT NULL,
  job_description text,
  notes text,
  applied_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_applications_user_id_applied_at_idx
  ON public.job_applications(user_id, applied_at DESC);

CREATE INDEX IF NOT EXISTS job_applications_user_id_status_applied_at_idx
  ON public.job_applications(user_id, status, applied_at DESC);
