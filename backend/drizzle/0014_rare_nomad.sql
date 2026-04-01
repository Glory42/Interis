CREATE TABLE "serial_diary_entry" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"series_id" integer NOT NULL,
	"watched_date" date NOT NULL,
	"rating" integer,
	"rewatch" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serial_interaction" (
	"user_id" text NOT NULL,
	"series_id" integer NOT NULL,
	"liked" boolean DEFAULT false NOT NULL,
	"watchlisted" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "serial_interactions_unique" UNIQUE("user_id","series_id")
);
--> statement-breakpoint
CREATE TABLE "serial_review_like" (
	"user_id" text NOT NULL,
	"review_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "serial_review_likes_unique" UNIQUE("user_id","review_id")
);
--> statement-breakpoint
CREATE TABLE "serial_review" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"series_id" integer NOT NULL,
	"diary_entry_id" uuid,
	"content" text NOT NULL,
	"contains_spoilers" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "serial_reviews_user_series_unique" UNIQUE("user_id","series_id")
);
--> statement-breakpoint
ALTER TABLE "serial_diary_entry" ADD CONSTRAINT "serial_diary_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serial_diary_entry" ADD CONSTRAINT "serial_diary_entry_series_id_tv_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."tv_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serial_interaction" ADD CONSTRAINT "serial_interaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serial_interaction" ADD CONSTRAINT "serial_interaction_series_id_tv_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."tv_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serial_review_like" ADD CONSTRAINT "serial_review_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serial_review_like" ADD CONSTRAINT "serial_review_like_review_id_serial_review_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."serial_review"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serial_review" ADD CONSTRAINT "serial_review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serial_review" ADD CONSTRAINT "serial_review_series_id_tv_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."tv_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serial_review" ADD CONSTRAINT "serial_review_diary_entry_id_serial_diary_entry_id_fk" FOREIGN KEY ("diary_entry_id") REFERENCES "public"."serial_diary_entry"("id") ON DELETE set null ON UPDATE no action;