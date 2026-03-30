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
  v_latest_relevant_version public.cv_versions%ROWTYPE;
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

  PERFORM pg_advisory_xact_lock(
    hashtext(p_session_id),
    hashtext(COALESCE(p_target_resume_id, '__base__'))
  );

  SELECT *
  INTO v_latest_relevant_version
  FROM public.cv_versions
  WHERE
    session_id = p_session_id
    AND target_resume_id IS NOT DISTINCT FROM p_target_resume_id
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF v_latest_relevant_version.id IS NOT NULL
     AND v_latest_relevant_version.snapshot = p_snapshot THEN
    RETURN jsonb_build_object(
      'id', v_latest_relevant_version.id,
      'session_id', v_latest_relevant_version.session_id,
      'target_resume_id', v_latest_relevant_version.target_resume_id,
      'snapshot', v_latest_relevant_version.snapshot,
      'source', v_latest_relevant_version.source,
      'created_at', v_latest_relevant_version.created_at
    );
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
