CREATE TABLE "album" (
	"id" serial PRIMARY KEY NOT NULL,
	"mbid" text NOT NULL,
	"title" text NOT NULL,
	"artist_name" text NOT NULL,
	"artist_mbid" text,
	"cover_art_url" text,
	"primary_type" text,
	"secondary_types" jsonb,
	"first_release_date" text,
	"first_release_year" integer,
	"genres" jsonb,
	"disambiguation" text,
	"cached_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "album_mbid_unique" UNIQUE("mbid")
);
--> statement-breakpoint
CREATE TABLE "music_diary_entry" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"album_id" integer NOT NULL,
	"listened_date" text NOT NULL,
	"rating" integer,
	"relisten" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_interaction" (
	"user_id" text NOT NULL,
	"album_id" integer NOT NULL,
	"liked" boolean DEFAULT false NOT NULL,
	"want_to_listen" boolean DEFAULT false NOT NULL,
	"rating" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "music_interactions_unique" UNIQUE("user_id","album_id")
);
--> statement-breakpoint
CREATE TABLE "book_diary_entry" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"book_id" integer NOT NULL,
	"read_date" text NOT NULL,
	"rating" integer,
	"reread" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_interaction" (
	"user_id" text NOT NULL,
	"book_id" integer NOT NULL,
	"liked" boolean DEFAULT false NOT NULL,
	"want_to_read" boolean DEFAULT false NOT NULL,
	"rating" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "book_interactions_unique" UNIQUE("user_id","book_id")
);
--> statement-breakpoint
CREATE TABLE "book" (
	"id" serial PRIMARY KEY NOT NULL,
	"google_volume_id" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"authors" jsonb NOT NULL,
	"publisher" text,
	"published_date" text,
	"published_year" integer,
	"page_count" integer,
	"language" text,
	"categories" jsonb,
	"description" text,
	"cover_image_url" text,
	"isbn_13" text,
	"google_books_url" text,
	"cached_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "book_google_volume_id_unique" UNIQUE("google_volume_id")
);
--> statement-breakpoint
ALTER TABLE "music_diary_entry" ADD CONSTRAINT "music_diary_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_diary_entry" ADD CONSTRAINT "music_diary_entry_album_id_album_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."album"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_interaction" ADD CONSTRAINT "music_interaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_interaction" ADD CONSTRAINT "music_interaction_album_id_album_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."album"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_diary_entry" ADD CONSTRAINT "book_diary_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_diary_entry" ADD CONSTRAINT "book_diary_entry_book_id_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_interaction" ADD CONSTRAINT "book_interaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_interaction" ADD CONSTRAINT "book_interaction_book_id_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("id") ON DELETE cascade ON UPDATE no action;