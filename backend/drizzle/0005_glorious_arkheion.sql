ALTER TABLE "profile" ALTER COLUMN "theme" DROP DEFAULT;--> statement-breakpoint
UPDATE "profile"
SET "theme" = 'arkheion'
WHERE "theme" IN ('github-dark', 'github-light');--> statement-breakpoint
ALTER TYPE "public"."theme" RENAME TO "theme_legacy";--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('arkheion', 'amber-signal', 'goth', 'catppuccin-mocha', 'catppuccin-latte', 'nord-dark', 'nord-light', 'sunset');--> statement-breakpoint
ALTER TABLE "profile"
ALTER COLUMN "theme" TYPE "public"."theme"
USING ("theme"::text::"public"."theme");--> statement-breakpoint
DROP TYPE "public"."theme_legacy";--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "theme" SET DEFAULT 'arkheion';
