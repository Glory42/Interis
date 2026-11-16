CREATE TYPE "public"."list_collaborator_status" AS ENUM('invited', 'accepted');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'list_invite';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'list_invite_accepted';--> statement-breakpoint
CREATE TABLE "list_collaborator" (
	"id" uuid PRIMARY KEY NOT NULL,
	"list_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"status" "list_collaborator_status" DEFAULT 'invited' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "list_collaborator_list_user_unique" UNIQUE("list_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "list_entry" ADD COLUMN "added_by_user_id" text;--> statement-breakpoint
ALTER TABLE "list_collaborator" ADD CONSTRAINT "list_collaborator_list_id_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_collaborator" ADD CONSTRAINT "list_collaborator_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_collaborator" ADD CONSTRAINT "list_collaborator_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "list_collaborator_user_status_idx" ON "list_collaborator" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "list_collaborator_invited_by_idx" ON "list_collaborator" USING btree ("invited_by_user_id");--> statement-breakpoint
ALTER TABLE "list_entry" ADD CONSTRAINT "list_entry_added_by_user_id_user_id_fk" FOREIGN KEY ("added_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "le_added_by_idx" ON "list_entry" USING btree ("added_by_user_id");