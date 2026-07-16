import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  date,
  uuid,
  real,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../../infrastructure/database/auth.entity";
import { movies } from "../movies/movies.entity";

export const diaryEntries = pgTable(
  "diary_entry",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    movieId: integer("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    watchedDate: date("watched_date").notNull(),
    // 0–10 stored directly as float (real), displayed as plain score on frontend
    rating: real("rating"),
    rewatch: boolean("rewatch").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("diary_entry_user_id_idx").on(table.userId),
    index("diary_entry_movie_id_idx").on(table.movieId),
    // Backs the diary page query: WHERE user_id = X ORDER BY watched_date DESC, created_at DESC
    index("diary_entry_user_watched_created_idx").on(
      table.userId,
      table.watchedDate,
      table.createdAt,
    ),
    // Backs the community-rating avg() subquery: WHERE movie_id = X AND rating IS NOT NULL
    index("diary_entry_movie_rating_idx")
      .on(table.movieId, table.rating)
      .where(sql`rating is not null`),
  ],
);
