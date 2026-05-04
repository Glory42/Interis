CREATE TYPE "public"."theme" AS ENUM('github-dark', 'github-light', 'catppuccin-mocha', 'catppuccin-latte', 'nord-dark', 'nord-light', 'sunset');--> statement-breakpoint
ALTER TABLE "profile" DROP CONSTRAINT "profile_username_unique";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "display_username" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "theme" "theme" DEFAULT 'github-dark' NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");