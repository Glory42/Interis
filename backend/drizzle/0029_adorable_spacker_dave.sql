ALTER TABLE "list_entry" DROP CONSTRAINT "list_entries_unique";--> statement-breakpoint
ALTER TABLE "list_entry" ALTER COLUMN "movie_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "list_entry" ADD COLUMN "tv_series_id" integer;--> statement-breakpoint
ALTER TABLE "list_entry" ADD COLUMN "item_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "list" ADD COLUMN "derived_type" text;--> statement-breakpoint
ALTER TABLE "list_entry" ADD CONSTRAINT "list_entry_tv_series_id_tv_series_id_fk" FOREIGN KEY ("tv_series_id") REFERENCES "public"."tv_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "le_cinema_unique" ON "list_entry" USING btree ("list_id","movie_id") WHERE movie_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "le_serial_unique" ON "list_entry" USING btree ("list_id","tv_series_id") WHERE tv_series_id IS NOT NULL;