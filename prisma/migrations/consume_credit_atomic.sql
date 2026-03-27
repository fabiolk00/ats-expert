-- Atomic credit consumption function to prevent race conditions
-- This function guarantees that only one request can consume a credit even with concurrent access

CREATE OR REPLACE FUNCTION consume_credit_atomic(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Atomic UPDATE: decrement credits_remaining by 1 ONLY if > 0
  -- FOR UPDATE would lock the row, but UPDATE with WHERE is atomic enough
  UPDATE credit_accounts
  SET
    credits_remaining = credits_remaining - 1,
    updated_at = NOW()
  WHERE
    user_id = p_user_id
    AND credits_remaining > 0
  RETURNING credits_remaining INTO updated_count;

  -- If no rows were updated (updated_count IS NULL), user had 0 credits or doesn't exist
  RETURN updated_count IS NOT NULL;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION consume_credit_atomic(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_credit_atomic(TEXT) TO service_role;
