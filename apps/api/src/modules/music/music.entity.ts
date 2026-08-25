import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uuid,
  unique,
  real,
} from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";

export const albums = pgTable("album", {
  id: serial("id").primaryKey(),
  mbid: text("mbid").notNull().unique(),
  title: text("title").notNull(),
  artistName: text("artist_name").notNull(),
  artistMbid: text("artist_mbid"),
  coverArtUrl: text("cover_art_url"),
  primaryType: text("primary_type"),
  secondaryTypes: jsonb("secondary_types").$type<string[]>(),
  firstReleaseDate: text("first_release_date"),
  firstReleaseYear: integer("first_release_year"),
  genres: jsonb("genres").$type<{ name: string; count: number }[]>(),
  disambiguation: text("disambiguation"),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
});

export const musicDiaryEntries = pgTable("music_diary_entry", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  albumId: integer("album_id")
    .notNull()
    .references(() => albums.id, { onDelete: "cascade" }),
  listenedDate: text("listened_date").notNull(),
  rating: real("rating"),
  relisten: boolean("relisten").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const musicInteractions = pgTable(
  "music_interaction",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    albumId: integer("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    liked: boolean("liked").default(false).notNull(),
    wantToListen: boolean("want_to_listen").default(false).notNull(),
    rating: real("rating"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [unique("music_interactions_unique").on(table.userId, table.albumId)],
);
