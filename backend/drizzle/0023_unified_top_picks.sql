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
--> statement-breakpoint
INSERT INTO "profile_top_pick" (
	"user_id",
	"category_id",
	"slot",
	"media_type",
	"media_source",
	"media_source_id",
	"title",
	"poster_path",
	"release_year"
)
SELECT
	p."user_id",
	1,
	mapped."slot",
	'movie',
	'tmdb',
	m."tmdb_id"::text,
	m."title",
	m."poster_path",
	m."release_year"
FROM "profile" p
CROSS JOIN LATERAL (
	SELECT
		(value)::integer AS movie_id,
		(ord)::integer AS slot
	FROM jsonb_array_elements_text(COALESCE(p."top4_movie_ids", '[]'::jsonb))
	WITH ORDINALITY AS source(value, ord)
	WHERE ord <= 4
) AS mapped
INNER JOIN "movie" m ON m."id" = mapped.movie_id;
