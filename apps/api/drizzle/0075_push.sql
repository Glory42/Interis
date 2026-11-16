CREATE TABLE "push_preference" (
	"user_id" text PRIMARY KEY NOT NULL,
	"follows" boolean DEFAULT true NOT NULL,
	"likes" boolean DEFAULT true NOT NULL,
	"comments" boolean DEFAULT true NOT NULL,
	"moderation" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscription" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "push_preference" ADD CONSTRAINT "push_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscription_endpoint_unique" ON "push_subscription" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "push_subscription_user_last_used_idx" ON "push_subscription" USING btree ("user_id","last_used_at");