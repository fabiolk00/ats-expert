-- Atomic message count increment with 15 message cap enforcement
-- This function guarantees race-condition-free message counting

CREATE OR REPLACE FUNCTION increment_message_count(session_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- Atomic UPDATE: increment message_count by 1 ONLY if < 15
  UPDATE sessions
  SET
    message_count = message_count + 1,
    updated_at = NOW()
  WHERE
    id = session_id
    AND message_count < 15
  RETURNING message_count INTO new_count;

  -- If no rows were updated (new_count IS NULL), session hit 15 message limit or doesn't exist
  RETURN new_count IS NOT NULL;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_message_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_message_count(TEXT) TO service_role;
