import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  unique,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";

// Deliberately narrower than the app-wide MediaType union - standalone posts
// don't support attaching an album/book (see 0027_remove_post_book_music_media_type).
export const postMediaTypeEnum = pgEnum("post_media_type", [
  "movie",
  "tv",
]);

export type PostMediaType = (typeof postMediaTypeEnum.enumValues)[number];

export const posts = pgTable("post", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  // Optional media attachment
  mediaId: integer("media_id"),
  mediaType: postMediaTypeEnum("media_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index("post_user_id_idx").on(table.userId),
  index("post_media_id_idx").on(table.mediaId),
  // Backs the profile posts page query: WHERE user_id = X ORDER BY created_at DESC
  index("post_user_created_idx").on(table.userId, table.createdAt),
]);

export const postLikes = pgTable(
  "post_like",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique("post_likes_unique").on(table.userId, table.postId)],
);

export const postComments = pgTable(
  "post_comment",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("post_comment_post_id_idx").on(table.postId)],
);
