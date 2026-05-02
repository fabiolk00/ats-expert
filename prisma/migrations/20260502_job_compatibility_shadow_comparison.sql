CREATE TABLE IF NOT EXISTS public.job_compatibility_shadow_comparison (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text REFERENCES public.users(id) ON DELETE SET NULL,
  session_id text REFERENCES public.sessions(id) ON DELETE SET NULL,
  case_id text,

  legacy_score integer,
  assessment_score integer,
  score_delta integer,

  legacy_critical_gaps_count integer,
  assessment_critical_gaps_count integer,
  critical_gap_delta integer,

  legacy_low_fit_triggered boolean,
  assessment_low_fit_triggered boolean,
  low_fit_delta boolean,

  legacy_unsupported_count integer,
  assessment_unsupported_count integer,
  assessment_supported_count integer,
  assessment_adjacent_count integer,
  assessment_forbidden_claim_count integer,

  assessment_version text NOT NULL,
  score_version text NOT NULL,
  catalog_version text NOT NULL,

  source text NOT NULL DEFAULT 'batch',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_compat_shadow_case_idx
  ON public.job_compatibility_shadow_comparison(case_id);

CREATE INDEX IF NOT EXISTS job_compat_shadow_created_idx
  ON public.job_compatibility_shadow_comparison(created_at DESC);

