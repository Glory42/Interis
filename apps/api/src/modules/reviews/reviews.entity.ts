import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  uuid,
  unique,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";
import { diaryEntries } from "../diary/diary.entity";
import { movies } from "../movies/movies.entity";
import { serialDiaryEntries } from "../serials/serials.entity";

// mediaSource/mediaSourceId identify the external media record (e.g. TMDB id).
export const reviews = pgTable(
  "review",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull().default("movie"),
    mediaSource: text("media_source").notNull().default("tmdb"),
    mediaSourceId: text("media_source_id").notNull(),
    movieId: integer("movie_id").references(() => movies.id, { onDelete: "cascade" }),
    // The log the review was written with: a movie log for movie reviews, a
    // series log for tv reviews. Deleting the log keeps the review (#87).
    diaryEntryId: uuid("diary_entry_id").references(() => diaryEntries.id, {
      onDelete: "set null",
    }),
    serialDiaryEntryId: uuid("serial_diary_entry_id").references(() => serialDiaryEntries.id, {
      onDelete: "set null",
    }),
    content: text("content").notNull(),
    containsSpoilers: boolean("contains_spoilers").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Not unique: a user can review the same title more than once (#72).
    index("review_user_media_idx").on(
      table.userId,
      table.mediaType,
      table.mediaSource,
      table.mediaSourceId,
      table.createdAt,
    ),
    index("review_movie_id_idx").on(table.movieId),
    // Backs the network stats' reviews-today count.
    index("review_created_at_idx").on(table.createdAt),
    // One review per log: logs find their review by this column (#73).
    uniqueIndex("review_diary_entry_id_unique").on(table.diaryEntryId),
    uniqueIndex("review_serial_diary_entry_id_unique").on(table.serialDiaryEntryId),
    // Backs lookups by these three columns without userId.
    index("review_media_source_idx").on(
      table.mediaType,
      table.mediaSource,
      table.mediaSourceId,
    ),
  ],
);

export const comments = pgTable(
  "comment",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("comment_review_id_idx").on(table.reviewId)],
);

export const reviewLikes = pgTable(
  "review_like",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique("review_likes_unique").on(table.userId, table.reviewId)],
);

export const commentLikes = pgTable(
  "comment_like",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique("comment_likes_unique").on(table.userId, table.commentId)],
);
