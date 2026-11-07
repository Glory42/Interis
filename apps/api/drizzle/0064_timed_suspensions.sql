ALTER TABLE "profile" ADD COLUMN "suspended_until" timestamp;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "suspended_by" text;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_suspended_by_user_id_fk" FOREIGN KEY ("suspended_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;