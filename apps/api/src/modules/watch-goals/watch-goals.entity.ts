import { sql } from "drizzle-orm";
import { pgTable, text, integer, timestamp, uuid, unique, check } from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";

// One Watch Goal per user per year; past years stay as history.
// A goal targets Films, TV or both, so either target may be null but not both.
export const watchGoals = pgTable(
  "watch_goal",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    targetFilms: integer("target_films"),
    targetSeries: integer("target_series"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  // Leading user_id also backs the per-user goal-years lookup.
  (table) => [
    unique("watch_goal_user_year_unique").on(table.userId, table.year),
    check("watch_goal_has_target", sql`${table.targetFilms} IS NOT NULL OR ${table.targetSeries} IS NOT NULL`),
  ],
);
