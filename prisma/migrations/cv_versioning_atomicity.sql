DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'cv_version_source'
  ) THEN
    CREATE TYPE public.cv_version_source AS ENUM (
      'ingestion',
      'rewrite',
      'manual',
      'target-derived'
    );
  END IF;
END;
$$;

ALTER TABLE public.cv_versions
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.resume_targets
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.cv_versions
  ALTER COLUMN source TYPE public.cv_version_source
  USING source::public.cv_version_source;

CREATE OR REPLACE FUNCTION create_cv_version_record(
  p_session_id TEXT,
  p_snapshot JSONB,
  p_source public.cv_version_source,
  p_target_resume_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_target_session_id TEXT;
  v_created_version public.cv_versions%ROWTYPE;
BEGIN
  PERFORM 1
  FROM public.sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session % not found for CV version creation', p_session_id;
  END IF;

  IF p_target_resume_id IS NOT NULL THEN
    SELECT session_id
    INTO v_target_session_id
    FROM public.resume_targets
    WHERE id = p_target_resume_id;

    IF v_target_session_id IS NULL THEN
      RAISE EXCEPTION 'Resume target % not found for CV version creation', p_target_resume_id;
    END IF;

    IF v_target_session_id <> p_session_id THEN
      RAISE EXCEPTION 'Resume target % does not belong to session %', p_target_resume_id, p_session_id;
    END IF;
  END IF;

  INSERT INTO public.cv_versions (
    session_id,
    target_resume_id,
    snapshot,
    source
  )
  VALUES (
    p_session_id,
    p_target_resume_id,
    p_snapshot,
    p_source
  )
  RETURNING *
  INTO v_created_version;

  RETURN jsonb_build_object(
    'id', v_created_version.id,
    'session_id', v_created_version.session_id,
    'target_resume_id', v_created_version.target_resume_id,
    'snapshot', v_created_version.snapshot,
    'source', v_created_version.source,
    'created_at', v_created_version.created_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION apply_session_patch_with_version(
  p_session_id TEXT,
  p_user_id TEXT,
  p_phase TEXT,
  p_cv_state JSONB,
  p_agent_state JSONB,
  p_generated_output JSONB,
  p_ats_score JSONB DEFAULT NULL,
  p_version_source public.cv_version_source DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated_session_id TEXT;
BEGIN
  UPDATE public.sessions
  SET
    phase = p_phase,
    cv_state = p_cv_state,
    agent_state = p_agent_state,
    generated_output = p_generated_output,
    ats_score = p_ats_score,
    updated_at = NOW()
  WHERE
    id = p_session_id
    AND user_id = p_user_id
  RETURNING id
  INTO v_updated_session_id;

  IF v_updated_session_id IS NULL THEN
    RAISE EXCEPTION 'Session % not found for user %', p_session_id, p_user_id;
  END IF;

  IF p_version_source IS NOT NULL THEN
    PERFORM 1
    FROM create_cv_version_record(
      p_session_id,
      p_cv_state,
      p_version_source,
      NULL
    );
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION create_resume_target_with_version(
  p_session_id TEXT,
  p_user_id TEXT,
  p_target_job_description TEXT,
  p_derived_cv_state JSONB,
  p_gap_analysis JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_target public.resume_targets%ROWTYPE;
BEGIN
  PERFORM 1
  FROM public.sessions
  WHERE
    id = p_session_id
    AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session % not found for user %', p_session_id, p_user_id;
  END IF;

  INSERT INTO public.resume_targets (
    session_id,
    target_job_description,
    derived_cv_state,
    gap_analysis
  )
  VALUES (
    p_session_id,
    p_target_job_description,
    p_derived_cv_state,
    p_gap_analysis
  )
  RETURNING *
  INTO v_target;

  PERFORM 1
  FROM create_cv_version_record(
    p_session_id,
    p_derived_cv_state,
    'target-derived',
    v_target.id
  );

  RETURN jsonb_build_object(
    'id', v_target.id,
    'session_id', v_target.session_id,
    'target_job_description', v_target.target_job_description,
    'derived_cv_state', v_target.derived_cv_state,
    'gap_analysis', v_target.gap_analysis,
    'created_at', v_target.created_at,
    'updated_at', v_target.updated_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_cv_version_record(
  TEXT,
  JSONB,
  public.cv_version_source,
  TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION create_cv_version_record(
  TEXT,
  JSONB,
  public.cv_version_source,
  TEXT
) TO service_role;

GRANT EXECUTE ON FUNCTION apply_session_patch_with_version(
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  JSONB,
  JSONB,
  JSONB,
  public.cv_version_source
) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_session_patch_with_version(
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  JSONB,
  JSONB,
  JSONB,
  public.cv_version_source
) TO service_role;

GRANT EXECUTE ON FUNCTION create_resume_target_with_version(
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  JSONB
) TO authenticated;
GRANT EXECUTE ON FUNCTION create_resume_target_with_version(
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  JSONB
) TO service_role;
