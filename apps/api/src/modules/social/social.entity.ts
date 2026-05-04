import {
  pgTable,
  text,
  timestamp,
  uuid,
  unique,
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
  (table) => [unique("follows_unique").on(table.followerId, table.followingId)],
);

export const activities = pgTable("activity", {
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
});
