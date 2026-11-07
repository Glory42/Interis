CREATE INDEX "movie_cached_at_idx" ON "movie" USING btree ("cached_at");--> statement-breakpoint
CREATE INDEX "tv_series_cached_at_idx" ON "tv_series" USING btree ("cached_at");