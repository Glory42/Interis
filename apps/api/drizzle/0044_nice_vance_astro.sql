CREATE TABLE "security_answers" (
	"user_id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "security_answers" ADD CONSTRAINT "security_answers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;