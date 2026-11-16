CREATE TABLE "diary_tag" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"diary_entry_id" uuid,
	"serial_diary_entry_id" uuid,
	"tag" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "diary_tag_one_entry" CHECK ((diary_entry_id is null) <> (serial_diary_entry_id is null))
);
--> statement-breakpoint
ALTER TABLE "serial_diary_entry" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "diary_entry" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "diary_tag" ADD CONSTRAINT "diary_tag_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_tag" ADD CONSTRAINT "diary_tag_diary_entry_id_diary_entry_id_fk" FOREIGN KEY ("diary_entry_id") REFERENCES "public"."diary_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_tag" ADD CONSTRAINT "diary_tag_serial_diary_entry_id_serial_diary_entry_id_fk" FOREIGN KEY ("serial_diary_entry_id") REFERENCES "public"."serial_diary_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "diary_tag_film_entry_tag_unique" ON "diary_tag" USING btree ("diary_entry_id","tag") WHERE diary_entry_id is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "diary_tag_series_entry_tag_unique" ON "diary_tag" USING btree ("serial_diary_entry_id","tag") WHERE serial_diary_entry_id is not null;--> statement-breakpoint
CREATE INDEX "diary_tag_user_tag_idx" ON "diary_tag" USING btree ("user_id","tag");