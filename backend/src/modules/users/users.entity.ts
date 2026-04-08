import {
  pgTable,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  serial,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";
import { DEFAULT_THEME_ID } from "./constants/theme.constants";

// username lives in BA's user table now — no duplication here
export const profiles = pgTable("profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  bio: text("bio"),
  location: text("location"),
  avatarUrl: text("avatar_url"),
  favoriteGenres: jsonb("favorite_genres").$type<string[]>().default([]).notNull(),
  themeId: text("theme").default(DEFAULT_THEME_ID).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const profileTopPicks = pgTable(
  "profile_top_pick",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").notNull(),
    slot: integer("slot").notNull(),
    mediaType: text("media_type").notNull(),
    mediaSource: text("media_source").notNull().default("tmdb"),
    mediaSourceId: text("media_source_id").notNull(),
    title: text("title"),
    posterPath: text("poster_path"),
    releaseYear: integer("release_year"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("profile_top_pick_user_category_slot_unique").on(
      table.userId,
      table.categoryId,
      table.slot,
    ),
    unique("profile_top_pick_user_category_media_unique").on(
      table.userId,
      table.categoryId,
      table.mediaSource,
      table.mediaSourceId,
    ),
  ],
);
