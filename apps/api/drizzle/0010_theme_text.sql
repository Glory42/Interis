ALTER TABLE "profile" ALTER COLUMN "theme" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "theme" SET DATA TYPE text USING "theme"::text;--> statement-breakpoint
UPDATE "profile" SET "theme" = 'catppuccin-mocha';--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "theme" SET DEFAULT 'catppuccin-mocha';--> statement-breakpoint
DROP TYPE IF EXISTS "public"."theme";
