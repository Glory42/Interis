ALTER TABLE "profile" ADD COLUMN "favorite_genres" jsonb DEFAULT '[]'::jsonb NOT NULL;
