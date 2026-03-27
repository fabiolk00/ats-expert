ALTER TABLE public.resume_targets
  ADD COLUMN IF NOT EXISTS generated_output jsonb;

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
    gap_analysis,
    generated_output
  )
  VALUES (
    p_session_id,
    p_target_job_description,
    p_derived_cv_state,
    p_gap_analysis,
    NULL
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
    'generated_output', v_target.generated_output,
    'created_at', v_target.created_at,
    'updated_at', v_target.updated_at
  );
END;
$$;
