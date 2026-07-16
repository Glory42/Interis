ALTER TABLE "profile" ALTER COLUMN "theme" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "theme" SET DEFAULT 'arkheion'::text;--> statement-breakpoint
DROP TYPE "public"."theme";--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('arkheion', 'amber-signal', 'goth', 'catppuccin-mocha', 'catppuccin-latte', 'nord-dark', 'nord-light', 'sunset');--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "theme" SET DEFAULT 'arkheion'::"public"."theme";--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "theme" SET DATA TYPE "public"."theme" USING "theme"::"public"."theme";