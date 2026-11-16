CREATE TABLE "watch_goal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"year" integer NOT NULL,
	"target_films" integer NOT NULL,
	"target_series" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "watch_goal_user_year_unique" UNIQUE("user_id","year")
);
--> statement-breakpoint
ALTER TABLE "watch_goal" ADD CONSTRAINT "watch_goal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;