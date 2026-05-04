ALTER TABLE "post" ALTER COLUMN "media_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."post_media_type";--> statement-breakpoint
CREATE TYPE "public"."post_media_type" AS ENUM('movie', 'tv');--> statement-breakpoint
ALTER TABLE "post" ALTER COLUMN "media_type" SET DATA TYPE "public"."post_media_type" USING "media_type"::"public"."post_media_type";