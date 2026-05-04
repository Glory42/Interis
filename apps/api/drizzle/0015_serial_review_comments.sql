CREATE TABLE "serial_review_comment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"review_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "serial_review_comment" ADD CONSTRAINT "serial_review_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "serial_review_comment" ADD CONSTRAINT "serial_review_comment_review_id_serial_review_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."serial_review"("id") ON DELETE cascade ON UPDATE no action;
