DROP INDEX "le_cinema_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "le_movie_unique" ON "list_entry" USING btree ("list_id","movie_id") WHERE movie_id IS NOT NULL;