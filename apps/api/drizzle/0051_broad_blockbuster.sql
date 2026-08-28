CREATE TABLE "edition_track" (
	"id" serial PRIMARY KEY NOT NULL,
	"edition_id" integer NOT NULL,
	"track_id" integer NOT NULL,
	"disc_number" integer DEFAULT 1 NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "edition_track_slot_unique" UNIQUE("edition_id","disc_number","position")
);
--> statement-breakpoint
CREATE TABLE "edition" (
	"id" serial PRIMARY KEY NOT NULL,
	"album_id" integer NOT NULL,
	"mbid" text NOT NULL,
	"title" text NOT NULL,
	"status" text,
	"packaging" text,
	"country" text,
	"release_date" text,
	"release_year" integer,
	"format" text,
	"track_count" integer,
	"disambiguation" text,
	"cached_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "edition_mbid_unique" UNIQUE("mbid")
);
--> statement-breakpoint
CREATE TABLE "track_diary_entry" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"track_id" integer NOT NULL,
	"listened_date" text NOT NULL,
	"rating" real,
	"relisten" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "track_interaction" (
	"user_id" text NOT NULL,
	"track_id" integer NOT NULL,
	"liked" boolean DEFAULT false NOT NULL,
	"rating" real,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "track_interactions_unique" UNIQUE("user_id","track_id")
);
--> statement-breakpoint
CREATE TABLE "track" (
	"id" serial PRIMARY KEY NOT NULL,
	"mbid" text NOT NULL,
	"title" text NOT NULL,
	"artist_name" text NOT NULL,
	"length" integer,
	"disambiguation" text,
	"cached_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "track_mbid_unique" UNIQUE("mbid")
);
--> statement-breakpoint
ALTER TABLE "edition_track" ADD CONSTRAINT "edition_track_edition_id_edition_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."edition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition_track" ADD CONSTRAINT "edition_track_track_id_track_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."track"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition" ADD CONSTRAINT "edition_album_id_album_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."album"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_diary_entry" ADD CONSTRAINT "track_diary_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_diary_entry" ADD CONSTRAINT "track_diary_entry_track_id_track_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."track"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_interaction" ADD CONSTRAINT "track_interaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_interaction" ADD CONSTRAINT "track_interaction_track_id_track_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."track"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "edition_track_edition_id_idx" ON "edition_track" USING btree ("edition_id");--> statement-breakpoint
CREATE INDEX "edition_track_track_id_idx" ON "edition_track" USING btree ("track_id");--> statement-breakpoint
CREATE INDEX "edition_album_id_idx" ON "edition" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "track_diary_entry_user_id_idx" ON "track_diary_entry" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "track_diary_entry_track_id_idx" ON "track_diary_entry" USING btree ("track_id");--> statement-breakpoint
CREATE INDEX "track_interaction_track_id_idx" ON "track_interaction" USING btree ("track_id");