ALTER TABLE "album" ADD COLUMN "lastfm_listeners" integer;--> statement-breakpoint
ALTER TABLE "album" ADD COLUMN "lastfm_playcount" integer;--> statement-breakpoint
ALTER TABLE "album" ADD COLUMN "lastfm_fetched_at" timestamp;