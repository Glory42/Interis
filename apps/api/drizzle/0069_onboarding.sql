ALTER TABLE "profile" ADD COLUMN "onboarding_completed_at" timestamp;--> statement-breakpoint
-- Accounts that predate onboarding never see it.
UPDATE "profile" SET "onboarding_completed_at" = "created_at" WHERE "onboarding_completed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "serial_interaction_series_id_idx" ON "serial_interaction" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "movie_interaction_movie_id_idx" ON "movie_interaction" USING btree ("movie_id");
