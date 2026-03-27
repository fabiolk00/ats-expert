ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS agent_state JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS generated_output JSONB NOT NULL DEFAULT '{}'::jsonb;
