CREATE TABLE "nyt_bestseller_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"list_name" text NOT NULL,
	"items" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nyt_bestseller_cache_list_name_unique" UNIQUE("list_name")
);
