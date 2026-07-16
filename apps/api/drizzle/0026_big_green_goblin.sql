-- No-op: every statement in this migration duplicated
-- 0025_remove_legacy_profile_fields.sql (same columns) except missing its
-- `DROP COLUMN IF EXISTS` guard - a snapshot-drift artifact from generation.
-- Removed to let migrations replay cleanly against a fresh database.
SELECT 1;
