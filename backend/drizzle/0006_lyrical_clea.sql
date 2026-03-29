CREATE TYPE "public"."post_media_type" AS ENUM('movie', 'tv', 'book', 'music');--> statement-breakpoint
CREATE TABLE "post_comment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_like" (
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_likes_unique" UNIQUE("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"media_id" integer,
	"media_type" "post_media_type",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "theme" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "theme" SET DEFAULT 'arkheion'::text;--> statement-breakpoint
DROP TYPE "public"."theme";--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('arkheion', 'amber-signal', 'goth', 'catppuccin-mocha', 'catppuccin-latte', 'nord-dark', 'nord-light', 'sunset');--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "theme" SET DEFAULT 'arkheion'::"public"."theme";--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "theme" SET DATA TYPE "public"."theme" USING "theme"::"public"."theme";--> statement-breakpoint
ALTER TABLE "post_comment" ADD CONSTRAINT "post_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comment" ADD CONSTRAINT "post_comment_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_like" ADD CONSTRAINT "post_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_like" ADD CONSTRAINT "post_like_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;