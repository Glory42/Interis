ALTER TABLE "movie_interaction" ADD COLUMN "is_watched" boolean DEFAULT false NOT NULL;

-- Historical data migration for movies, seasons, and episodes
UPDATE "movie_interaction" SET "is_watched" = true WHERE "liked" = true OR "rating" IS NOT NULL;
UPDATE "serial_season_interaction" SET "watched" = true WHERE "liked" = true OR "rating" IS NOT NULL;
UPDATE "serial_episode_interaction" SET "watched" = true WHERE "liked" = true OR "rating" IS NOT NULL;