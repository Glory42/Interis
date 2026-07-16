-- No-op: this migration's CREATE TABLE + ADD CONSTRAINT duplicated
-- 0023_unified_top_picks.sql exactly - a snapshot-drift artifact from
-- generation. Removed to let migrations replay cleanly against a fresh
-- database.
SELECT 1;
