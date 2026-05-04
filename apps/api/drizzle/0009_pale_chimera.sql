ALTER TABLE "movie" ADD COLUMN "release_date" date;--> statement-breakpoint
ALTER TABLE "movie" ADD COLUMN "director" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "favorite_genres" jsonb DEFAULT '[]'::jsonb NOT NULL;