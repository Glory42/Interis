import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";

export const notificationTypeEnum = pgEnum("notification_type", [
  "follow",
  "like_review",
  "like_post",
  "like_activity",
  "comment_review",
  "comment_post",
]);

export const notifications = pgTable(
  "notification",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: text("metadata"), // JSON string
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_recipient_created_idx").on(table.recipientId, table.createdAt),
    index("notification_recipient_unread_idx").on(table.recipientId, table.isRead),
  ],
);
