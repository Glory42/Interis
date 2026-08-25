CREATE INDEX "diary_entry_user_id_idx" ON "diary_entry" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "diary_entry_movie_id_idx" ON "diary_entry" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX "comment_review_id_idx" ON "comment" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "review_movie_id_idx" ON "review" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX "post_comment_post_id_idx" ON "post_comment" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "activity_user_id_created_at_idx" ON "activity" USING btree ("user_id","created_at");