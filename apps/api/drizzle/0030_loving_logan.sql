CREATE TABLE "list_like" (
	"user_id" text NOT NULL,
	"list_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "list_likes_unique" UNIQUE("user_id","list_id")
);
--> statement-breakpoint
ALTER TABLE "list_like" ADD CONSTRAINT "list_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_like" ADD CONSTRAINT "list_like_list_id_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."list"("id") ON DELETE cascade ON UPDATE no action;