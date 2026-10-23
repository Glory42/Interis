ALTER TABLE "review" DROP CONSTRAINT "reviews_user_media_unique";--> statement-breakpoint
DROP INDEX "review_diary_entry_id_idx";--> statement-breakpoint
CREATE INDEX "review_user_media_idx" ON "review" USING btree ("user_id","media_type","media_source","media_source_id","created_at");--> statement-breakpoint
-- Movie logs now find their review by diary_entry_id instead of by title
-- (#73). Link each movie review that points at no existing log to the
-- user's latest log of that movie, so the review keeps showing on a log.
UPDATE "review" AS r
SET "diary_entry_id" = (
  SELECT d."id"
  FROM "diary_entry" AS d
  WHERE d."user_id" = r."user_id" AND d."movie_id" = r."movie_id"
  ORDER BY d."watched_date" DESC, d."created_at" DESC
  LIMIT 1
)
WHERE r."media_type" = 'movie'
  AND r."movie_id" IS NOT NULL
  AND (
    r."diary_entry_id" IS NULL
    OR NOT EXISTS (SELECT 1 FROM "diary_entry" AS e WHERE e."id" = r."diary_entry_id")
  );--> statement-breakpoint
-- One review per log: if two reviews claim the same log, the newest keeps it.
UPDATE "review" AS r
SET "diary_entry_id" = NULL
WHERE r."diary_entry_id" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "review" AS newer
    WHERE newer."diary_entry_id" = r."diary_entry_id"
      AND (newer."created_at", newer."id") > (r."created_at", r."id")
  );--> statement-breakpoint
CREATE UNIQUE INDEX "review_diary_entry_id_unique" ON "review" USING btree ("diary_entry_id");