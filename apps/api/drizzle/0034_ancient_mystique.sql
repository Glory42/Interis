CREATE TABLE "activity_like" (
	"user_id" text NOT NULL,
	"activity_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "activity_likes_unique" UNIQUE("user_id","activity_id")
);
--> statement-breakpoint
ALTER TABLE "activity_like" ADD CONSTRAINT "activity_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_like" ADD CONSTRAINT "activity_like_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;