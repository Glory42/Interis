CREATE INDEX "serial_diary_entry_user_id_idx" ON "serial_diary_entry" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "serial_diary_entry_series_id_idx" ON "serial_diary_entry" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "person_slug_alias_person_id_idx" ON "person_slug_alias" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "review_diary_entry_id_idx" ON "review" USING btree ("diary_entry_id");--> statement-breakpoint
CREATE INDEX "post_user_id_idx" ON "post" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "post_media_id_idx" ON "post" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "follows_following_id_idx" ON "follow" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "list_user_id_idx" ON "list" USING btree ("user_id");