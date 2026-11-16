CREATE INDEX "comment_like_comment_id_idx" ON "comment_like" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "review_like_review_id_idx" ON "review_like" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "activity_like_activity_id_idx" ON "activity_like" USING btree ("activity_id");