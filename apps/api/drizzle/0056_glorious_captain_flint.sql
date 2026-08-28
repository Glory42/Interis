CREATE TABLE "lastfm_trending_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"chart_key" text NOT NULL,
	"items" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lastfm_trending_cache_chart_key_unique" UNIQUE("chart_key")
);
