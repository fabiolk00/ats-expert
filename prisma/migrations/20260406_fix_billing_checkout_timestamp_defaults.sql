ALTER TABLE billing_checkouts
  ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE billing_checkouts
  ALTER COLUMN updated_at SET DEFAULT NOW();

UPDATE billing_checkouts
SET
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL
   OR updated_at IS NULL;
