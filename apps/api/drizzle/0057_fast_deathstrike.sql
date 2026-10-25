CREATE INDEX "serial_diary_entry_created_at_idx" ON "serial_diary_entry" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "diary_entry_created_at_idx" ON "diary_entry" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "review_created_at_idx" ON "review" USING btree ("created_at");