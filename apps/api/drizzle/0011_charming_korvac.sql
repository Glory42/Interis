ALTER TABLE "profile" ALTER COLUMN "theme" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "theme" SET DEFAULT 'catppuccin-mocha';--> statement-breakpoint
DROP TYPE "public"."theme";