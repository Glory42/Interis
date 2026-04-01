ALTER TABLE "review" ADD COLUMN "media_type" text DEFAULT 'movie' NOT NULL;
--> statement-breakpoint
ALTER TABLE "review" ADD COLUMN "media_source" text DEFAULT 'tmdb' NOT NULL;
--> statement-breakpoint
ALTER TABLE "review" ADD COLUMN "media_source_id" text;
--> statement-breakpoint
UPDATE "review" AS r
SET "media_source_id" = m."tmdb_id"::text
FROM "movie" AS m
WHERE r."movie_id" = m."id" AND r."media_source_id" IS NULL;
--> statement-breakpoint
UPDATE "review"
SET "media_source_id" = "movie_id"::text
WHERE "media_source_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "review" ALTER COLUMN "media_source_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "review" ALTER COLUMN "movie_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "review" DROP CONSTRAINT IF EXISTS "review_diary_entry_id_diary_entry_id_fk";
--> statement-breakpoint
ALTER TABLE "review" DROP CONSTRAINT IF EXISTS "reviews_user_movie_unique";
--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "reviews_user_media_unique"
UNIQUE("user_id","media_type","media_source","media_source_id");
--> statement-breakpoint
DROP TABLE IF EXISTS "serial_review_comment" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "serial_review_like" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "serial_review" CASCADE;
