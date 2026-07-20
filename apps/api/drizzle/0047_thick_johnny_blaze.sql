ALTER TABLE "profile" ADD COLUMN "is_suspended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "suspended_at" timestamp;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "suspended_reason" text;