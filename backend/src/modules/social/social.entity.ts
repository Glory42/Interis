import {
  pgTable,
  text,
  timestamp,
  uuid,
  unique,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";

export const activityTypeEnum = pgEnum("activity_type", [
  "diary_entry",
  "review",
  "liked_movie",
  "watchlisted_movie",
  "followed_user",
  "created_list",
  "liked_review",
  "commented",
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

// Denormalized activity stream — feed query is a single JOIN on follows
// entityId points to the relevant row (diary entry id, review id, etc.)
// metadata carries display data so the feed doesn't need N extra queries
export const activities = pgTable("activity", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: activityTypeEnum("type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: text("metadata"), // JSON string — movie title, poster, username etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
