CREATE TABLE IF NOT EXISTS public.pdf_import_jobs (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  source_file_name text NOT NULL,
  source_file_size integer NOT NULL,
  replace_linkedin_import boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  warning_message text,
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pdf_import_jobs_user_id_idx
  ON public.pdf_import_jobs(user_id);

CREATE INDEX IF NOT EXISTS pdf_import_jobs_status_idx
  ON public.pdf_import_jobs(status);
