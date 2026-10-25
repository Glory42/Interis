ALTER TABLE "review" ADD COLUMN "serial_diary_entry_id" uuid;--> statement-breakpoint
-- Series reviews kept their series log id in diary_entry_id; move it to its own column.
UPDATE "review" SET "serial_diary_entry_id" = "diary_entry_id"
WHERE "media_type" <> 'movie'
  AND "diary_entry_id" IN (SELECT "id" FROM "serial_diary_entry");--> statement-breakpoint
-- Clear the moved ids and any that point at a deleted log.
UPDATE "review" SET "diary_entry_id" = NULL
WHERE "diary_entry_id" IS NOT NULL
  AND ("media_type" <> 'movie' OR "diary_entry_id" NOT IN (SELECT "id" FROM "diary_entry"));--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_diary_entry_id_diary_entry_id_fk" FOREIGN KEY ("diary_entry_id") REFERENCES "public"."diary_entry"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_serial_diary_entry_id_serial_diary_entry_id_fk" FOREIGN KEY ("serial_diary_entry_id") REFERENCES "public"."serial_diary_entry"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "review_serial_diary_entry_id_unique" ON "review" USING btree ("serial_diary_entry_id");