CREATE TABLE "serial_episode_interaction" (
	"user_id" text NOT NULL,
	"series_id" integer NOT NULL,
	"season_number" integer NOT NULL,
	"episode_number" integer NOT NULL,
	"watched" boolean DEFAULT false NOT NULL,
	"liked" boolean DEFAULT false NOT NULL,
	"rating" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "serial_episode_interactions_unique" UNIQUE("user_id","series_id","season_number","episode_number")
);
--> statement-breakpoint
CREATE TABLE "serial_season_interaction" (
	"user_id" text NOT NULL,
	"series_id" integer NOT NULL,
	"season_number" integer NOT NULL,
	"watched" boolean DEFAULT false NOT NULL,
	"liked" boolean DEFAULT false NOT NULL,
	"rating" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "serial_season_interactions_unique" UNIQUE("user_id","series_id","season_number")
);
--> statement-breakpoint
ALTER TABLE "serial_episode_interaction" ADD CONSTRAINT "serial_episode_interaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serial_episode_interaction" ADD CONSTRAINT "serial_episode_interaction_series_id_tv_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."tv_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serial_season_interaction" ADD CONSTRAINT "serial_season_interaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serial_season_interaction" ADD CONSTRAINT "serial_season_interaction_series_id_tv_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."tv_series"("id") ON DELETE cascade ON UPDATE no action;