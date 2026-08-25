CREATE INDEX "serial_diary_entry_user_watched_created_idx" ON "serial_diary_entry" USING btree ("user_id","watched_date","created_at");--> statement-breakpoint
CREATE INDEX "serial_diary_entry_series_rating_idx" ON "serial_diary_entry" USING btree ("series_id","rating") WHERE rating is not null;--> statement-breakpoint
CREATE INDEX "serial_interaction_series_rating_idx" ON "serial_interaction" USING btree ("series_id","rating") WHERE rating is not null;--> statement-breakpoint
CREATE INDEX "diary_entry_user_watched_created_idx" ON "diary_entry" USING btree ("user_id","watched_date","created_at");--> statement-breakpoint
CREATE INDEX "diary_entry_movie_rating_idx" ON "diary_entry" USING btree ("movie_id","rating") WHERE rating is not null;--> statement-breakpoint
CREATE INDEX "movie_interaction_movie_rating_idx" ON "movie_interaction" USING btree ("movie_id","rating") WHERE rating is not null;--> statement-breakpoint
DROP INDEX IF EXISTS "post_user_created_idx";--> statement-breakpoint
CREATE INDEX "post_user_created_idx" ON "post" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "list_user_updated_idx" ON "list" USING btree ("user_id","updated_at");