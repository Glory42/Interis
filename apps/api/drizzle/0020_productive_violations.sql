CREATE TABLE "person" (
	"id" serial PRIMARY KEY NOT NULL,
	"tmdb_person_id" integer NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"known_for_department" text,
	"route_role_hints" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"profile_path" text,
	"popularity" real,
	"cached_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "person_tmdb_person_id_unique" UNIQUE("tmdb_person_id"),
	CONSTRAINT "person_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "person_slug_alias" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" integer NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "person_slug_alias_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "person_slug_alias" ADD CONSTRAINT "person_slug_alias_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;