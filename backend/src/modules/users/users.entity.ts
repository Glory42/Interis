import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";

// Extends Better Auth's user table with app-specific profile data
export const profiles = pgTable("profile", {
  // Same id as Better Auth user — 1:1 relationship
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  bio: text("bio"),
  location: text("location"),
  avatarUrl: text("avatar_url"),
  backdropUrl: text("backdrop_url"),
  // Array of internal movie ids (our DB id, not tmdbId)
  top4MovieIds: jsonb("top4_movie_ids").$type<number[]>().default([]),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
