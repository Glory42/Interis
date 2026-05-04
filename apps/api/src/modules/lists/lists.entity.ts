import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  uniqueIndex,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../../infrastructure/database/auth.entity";
import { movies } from "../movies/movies.entity";
import { tvSeries } from "../serials/serials.entity";

export const lists = pgTable("list", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  isRanked: boolean("is_ranked").default(false).notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  derivedType: text("derived_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const listEntries = pgTable(
  "list_entry",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    movieId: integer("movie_id").references(() => movies.id, { onDelete: "cascade" }),
    tvSeriesId: integer("tv_series_id").references(() => tvSeries.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull(),
    position: integer("position").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("le_cinema_unique")
      .on(table.listId, table.movieId)
      .where(sql`movie_id IS NOT NULL`),
    uniqueIndex("le_serial_unique")
      .on(table.listId, table.tvSeriesId)
      .where(sql`tv_series_id IS NOT NULL`),
  ],
);

export const listLikes = pgTable(
  "list_like",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique("list_likes_unique").on(table.userId, table.listId)],
);
