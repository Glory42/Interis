import { pgTable, text, timestamp, unique, index } from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";

export const userBlocks = pgTable(
  "user_block",
  {
    blockerId: text("blocker_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blockedId: text("blocked_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("user_blocks_unique").on(table.blockerId, table.blockedId),
    index("user_blocks_blocked_id_idx").on(table.blockedId),
  ],
);

export const userMutes = pgTable(
  "user_mute",
  {
    muterId: text("muter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mutedId: text("muted_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("user_mutes_unique").on(table.muterId, table.mutedId),
    index("user_mutes_muted_id_idx").on(table.mutedId),
  ],
);
