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
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../../infrastructure/database/auth.entity";
import { films } from "../films/films.entity";
import { seriesDiaryEntries } from "../tv/tv.entity";

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
      .references(() => films.id, { onDelete: "cascade" }),
    watchedDate: date("watched_date").notNull(),
    // 0–10 stored directly as float (real), displayed as plain score on frontend
    rating: real("rating"),
    rewatch: boolean("rewatch").default(false).notNull(),
    // Private: only the owner's own reads select it.
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Leftmost movie_id still serves per-title reads; user_id adds the
    // one-user-one-title lookups (Your Rating, followed users on a title).
    index("diary_entry_movie_user_idx").on(table.movieId, table.userId),
    // Backs the network stats' logs-today count.
    index("diary_entry_created_at_idx").on(table.createdAt),
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

// One tag on one Diary Entry, Film or Series (exactly one FK is set, like list_entry).
// user_id is denormalized so "my entries tagged X" and tag counts stay on one index.
export const diaryTags = pgTable(
  "diary_tag",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    diaryEntryId: uuid("diary_entry_id").references(() => diaryEntries.id, { onDelete: "cascade" }),
    serialDiaryEntryId: uuid("serial_diary_entry_id").references(() => seriesDiaryEntries.id, {
      onDelete: "cascade",
    }),
    tag: text("tag").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("diary_tag_film_entry_tag_unique")
      .on(table.diaryEntryId, table.tag)
      .where(sql`diary_entry_id is not null`),
    uniqueIndex("diary_tag_series_entry_tag_unique")
      .on(table.serialDiaryEntryId, table.tag)
      .where(sql`serial_diary_entry_id is not null`),
    index("diary_tag_user_tag_idx").on(table.userId, table.tag),
    check(
      "diary_tag_one_entry",
      sql`(diary_entry_id is null) <> (serial_diary_entry_id is null)`,
    ),
  ],
);
