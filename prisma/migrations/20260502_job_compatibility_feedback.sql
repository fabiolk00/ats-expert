CREATE TABLE IF NOT EXISTS public.job_compatibility_feedback (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id text NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  assessment_version text NOT NULL,
  catalog_version text NOT NULL,
  score_version text NOT NULL,
  feedback_type text NOT NULL,
  target_signal text,
  requirement_id text,
  user_comment text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text,
  CONSTRAINT job_compatibility_feedback_type_check
    CHECK (feedback_type IN (
      'gap_marked_wrong',
      'supported_marked_wrong',
      'missing_evidence_claimed_by_user',
      'score_disagreed',
      'other'
    )),
  CONSTRAINT job_compatibility_feedback_status_check
    CHECK (status IN (
      'new',
      'reviewed',
      'catalog_change_needed',
      'resume_update_needed',
      'rejected'
    ))
);

CREATE INDEX IF NOT EXISTS job_compatibility_feedback_user_created_idx
  ON public.job_compatibility_feedback(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS job_compatibility_feedback_session_created_idx
  ON public.job_compatibility_feedback(session_id, created_at DESC);
