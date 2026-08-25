-- No-op: every statement in this migration duplicated 0010_theme_text.sql
-- (same column-to-text conversion, same default value) except missing its
-- `DROP TYPE IF EXISTS` guard - a snapshot-drift artifact from generation.
-- Removed to let migrations replay cleanly against a fresh database.
SELECT 1;
