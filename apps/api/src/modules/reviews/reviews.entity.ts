import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";
import { movies } from "../movies/movies.entity";

// Unified review model across media types.
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
    diaryEntryId: uuid("diary_entry_id"),
    content: text("content").notNull(),
    containsSpoilers: boolean("contains_spoilers").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("reviews_user_media_unique").on(
      table.userId,
      table.mediaType,
      table.mediaSource,
      table.mediaSourceId,
    ),
  ],
);

export const comments = pgTable("comment", {
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
});

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
