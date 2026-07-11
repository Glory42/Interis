import {
  pgTable,
  text,
  timestamp,
  uuid,
  unique,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";

// "post" added for Twitter-style standalone posts
export const activityTypeEnum = pgEnum("activity_type", [
  "diary_entry",
  "review",
  "liked_movie",
  "watchlisted_movie",
  "followed_user",
  "created_list",
  "liked_review",
  "commented",
  "post",
]);

export const follows = pgTable(
  "follow",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("follows_unique").on(table.followerId, table.followingId),
    index("follows_following_id_idx").on(table.followingId),
  ],
);

export const activities = pgTable(
  "activity",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: text("metadata"), // JSON string
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // Backs the feed query: WHERE user_id IN (...) ORDER BY created_at DESC
    index("activity_user_id_created_at_idx").on(table.userId, table.createdAt),
  ],
);

export const activityLikes = pgTable(
  "activity_like",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique("activity_likes_unique").on(table.userId, table.activityId)],
);
