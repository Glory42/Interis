CREATE INDEX "music_diary_entry_user_id_idx" ON "music_diary_entry" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "music_diary_entry_album_id_idx" ON "music_diary_entry" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "music_interaction_album_id_idx" ON "music_interaction" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "book_diary_entry_user_id_idx" ON "book_diary_entry" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "book_diary_entry_book_id_idx" ON "book_diary_entry" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "book_interaction_book_id_idx" ON "book_interaction" USING btree ("book_id");