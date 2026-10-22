CREATE TYPE "public"."serial_watch_status" AS ENUM('watching', 'paused', 'dropped', 'completed');--> statement-breakpoint
ALTER TABLE "serial_interaction" ADD COLUMN "watch_status" serial_watch_status;--> statement-breakpoint
CREATE INDEX "serial_interaction_user_watch_status_idx" ON "serial_interaction" USING btree ("user_id","watch_status");--> statement-breakpoint
-- Backfill (#65). Episode toggles never created a series row, so give every
-- series with watched regular episodes one before deriving the status.
INSERT INTO "serial_interaction" ("user_id", "series_id")
SELECT DISTINCT "user_id", "series_id"
FROM "serial_episode_interaction"
WHERE "watched" = true AND "season_number" > 0
ON CONFLICT ("user_id", "series_id") DO NOTHING;--> statement-breakpoint
-- is_watched (series toggle / log / review) or every regular episode checked
-- -> completed; some checked -> watching; nothing -> no status.
UPDATE "serial_interaction" AS si
SET "watch_status" = CASE
  WHEN si."is_watched" THEN 'completed'::serial_watch_status
  ELSE (
    SELECT CASE
      WHEN ts."number_of_episodes" > 0 AND progress."watched_count" >= ts."number_of_episodes" THEN 'completed'::serial_watch_status
      WHEN progress."watched_count" > 0 THEN 'watching'::serial_watch_status
    END
    FROM (
      SELECT count(*)::int AS "watched_count"
      FROM "serial_episode_interaction" AS e
      WHERE e."user_id" = si."user_id"
        AND e."series_id" = si."series_id"
        AND e."season_number" > 0
        AND e."watched" = true
    ) AS progress
  )
END
FROM "tv_series" AS ts
WHERE ts."id" = si."series_id";
