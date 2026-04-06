-- Atomic credit consumption + session creation in a single transaction.
-- Prevents credit loss when session creation fails after credit decrement.

CREATE OR REPLACE FUNCTION consume_credit_and_create_session(p_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_credit_updated BOOLEAN;
  v_session_row sessions%ROWTYPE;
BEGIN
  -- Step 1: atomically decrement credit
  UPDATE credit_accounts
  SET
    credits_remaining = credits_remaining - 1,
    updated_at = NOW()
  WHERE
    user_id = p_user_id
    AND credits_remaining > 0;

  v_credit_updated := FOUND;

  IF NOT v_credit_updated THEN
    RETURN NULL;  -- no credits available
  END IF;

  -- Step 2: create session (within the same transaction)
  INSERT INTO sessions (
    id,
    user_id,
    state_version,
    phase,
    cv_state,
    agent_state,
    generated_output,
    credits_used,
    credit_consumed,
    message_count,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid()::text,
    p_user_id,
    1,
    'intake',
    '{"fullName":"","email":"","phone":"","summary":"","experience":[],"skills":[],"education":[]}'::jsonb,
    '{"parseStatus":"empty","rewriteHistory":{}}'::jsonb,
    '{"status":"idle"}'::jsonb,
    0,
    TRUE,
    0,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_session_row;

  RETURN to_jsonb(v_session_row);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION consume_credit_and_create_session(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_credit_and_create_session(TEXT) TO service_role;
