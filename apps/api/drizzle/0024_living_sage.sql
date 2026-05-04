CREATE TABLE "profile_top_pick" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category_id" integer NOT NULL,
	"slot" integer NOT NULL,
	"media_type" text NOT NULL,
	"media_source" text DEFAULT 'tmdb' NOT NULL,
	"media_source_id" text NOT NULL,
	"title" text,
	"poster_path" text,
	"release_year" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_top_pick_user_category_slot_unique" UNIQUE("user_id","category_id","slot"),
	CONSTRAINT "profile_top_pick_user_category_media_unique" UNIQUE("user_id","category_id","media_source","media_source_id")
);
--> statement-breakpoint
ALTER TABLE "profile_top_pick" ADD CONSTRAINT "profile_top_pick_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;