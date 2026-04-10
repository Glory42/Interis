ALTER TABLE "post"
  ALTER COLUMN "media_type" TYPE text USING "media_type"::text;
--> statement-breakpoint
UPDATE "post"
SET "media_type" = NULL
WHERE "media_type" IN ('book', 'music');
--> statement-breakpoint
DROP TYPE "public"."post_media_type";
--> statement-breakpoint
CREATE TYPE "public"."post_media_type" AS ENUM('movie', 'tv');
--> statement-breakpoint
ALTER TABLE "post"
  ALTER COLUMN "media_type" TYPE "public"."post_media_type"
  USING CASE
    WHEN "media_type" IS NULL THEN NULL
    ELSE "media_type"::"public"."post_media_type"
  END;
