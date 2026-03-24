import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  date,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";
import { movies } from "../movies/movies.entity";

export const diaryEntries = pgTable("diary_entry", {
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
  // 0–10 stored as integer, displayed as plain score on frontend
  rating: integer("rating"),
  rewatch: boolean("rewatch").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
