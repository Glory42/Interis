import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  uniqueIndex,
  unique,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../../infrastructure/database/auth.entity";
import { films } from "../films/films.entity";
import { tvSeries } from "../tv/tv.entity";

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
}, (table) => [
  // Backs the profile lists page query: WHERE user_id = X ORDER BY updated_at DESC
  index("list_user_updated_idx").on(table.userId, table.updatedAt),
]);

export const listEntries = pgTable(
  "list_entry",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    movieId: integer("movie_id").references(() => films.id, { onDelete: "cascade" }),
    tvSeriesId: integer("tv_series_id").references(() => tvSeries.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull(),
    position: integer("position").notNull(),
    note: text("note"),
    // Who added the entry; null for entries from before List Collaborators.
    addedByUserId: text("added_by_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("le_added_by_idx").on(table.addedByUserId),
    uniqueIndex("le_movie_unique")
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

export const listCollaboratorStatusEnum = pgEnum("list_collaborator_status", ["invited", "accepted"]);

export const listCollaborators = pgTable(
  "list_collaborator",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    invitedByUserId: text("invited_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: listCollaboratorStatusEnum("status").default("invited").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Also backs "collaborators of a list" (leading list_id).
    unique("list_collaborator_list_user_unique").on(table.listId, table.userId),
    index("list_collaborator_user_status_idx").on(table.userId, table.status),
    index("list_collaborator_invited_by_idx").on(table.invitedByUserId),
  ],
);
