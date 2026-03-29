import {
  pgTable,
  pgEnum,
  text,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";
import { DEFAULT_THEME_ID, THEME_IDS } from "./constants/theme.constants";

// All valid theme names — default is arkheion
export const themeEnum = pgEnum("theme", THEME_IDS);

// username lives in BA's user table now — no duplication here
export const profiles = pgTable("profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  bio: text("bio"),
  location: text("location"),
  // Will be R2 URLs once upload is implemented (Phase 2)
  avatarUrl: text("avatar_url"),
  backdropUrl: text("backdrop_url"),
  top4MovieIds: jsonb("top4_movie_ids").$type<number[]>().default([]),
  favoriteGenres: jsonb("favorite_genres").$type<string[]>().default([]).notNull(),
  themeId: themeEnum("theme").default(DEFAULT_THEME_ID).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
