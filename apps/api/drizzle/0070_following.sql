DROP INDEX "serial_diary_entry_series_id_idx";--> statement-breakpoint
DROP INDEX "diary_entry_movie_id_idx";--> statement-breakpoint
CREATE INDEX "serial_diary_entry_series_user_idx" ON "serial_diary_entry" USING btree ("series_id","user_id");--> statement-breakpoint
CREATE INDEX "diary_entry_movie_user_idx" ON "diary_entry" USING btree ("movie_id","user_id");