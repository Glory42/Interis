import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  unique,
  real,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../../infrastructure/database/auth.entity";
import { movies } from "../movies/movies.entity";

export const movieInteractions = pgTable(
  "movie_interaction",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    movieId: integer("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    liked: boolean("liked").default(false).notNull(),
    watchlisted: boolean("watchlisted").default(false).notNull(),
    rating: real("rating"),
    isWatched: boolean("is_watched").default(false).notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("movie_interactions_unique").on(table.userId, table.movieId),
    // Backs the community-rating avg() subquery: WHERE movie_id = X AND rating IS NOT NULL
    // (movieId isn't the leftmost column in the unique index above, so it needs its own)
    index("movie_interaction_movie_rating_idx")
      .on(table.movieId, table.rating)
      .where(sql`rating is not null`),
  ],
);
