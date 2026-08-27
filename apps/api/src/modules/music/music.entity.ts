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
  index,
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

export const musicDiaryEntries = pgTable(
  "music_diary_entry",
  {
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
  },
  (table) => [
    index("music_diary_entry_user_id_idx").on(table.userId),
    index("music_diary_entry_album_id_idx").on(table.albumId),
  ],
);

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
  (table) => [
    unique("music_interactions_unique").on(table.userId, table.albumId),
    index("music_interaction_album_id_idx").on(table.albumId),
  ],
);

// One row per MusicBrainz release (a specific pressing/edition of an Album).
// Not independently reviewable - exists so users can browse an Album's
// different releases. See docs/adr/0002-track-recording-scoped-reviews.md.
export const editions = pgTable(
  "edition",
  {
    id: serial("id").primaryKey(),
    albumId: integer("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    mbid: text("mbid").notNull().unique(),
    title: text("title").notNull(),
    status: text("status"),
    packaging: text("packaging"),
    country: text("country"),
    releaseDate: text("release_date"),
    releaseYear: integer("release_year"),
    format: text("format"),
    trackCount: integer("track_count"),
    disambiguation: text("disambiguation"),
    cachedAt: timestamp("cached_at").defaultNow().notNull(),
  },
  (table) => [index("edition_album_id_idx").on(table.albumId)],
);

// One row per MusicBrainz recording - the canonical performance a Track
// represents, independent of which Edition/Album it's encountered through.
export const tracks = pgTable("track", {
  id: serial("id").primaryKey(),
  mbid: text("mbid").notNull().unique(),
  title: text("title").notNull(),
  artistName: text("artist_name").notNull(),
  length: integer("length"),
  disambiguation: text("disambiguation"),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
});

// Join table: which Tracks appear on a given Edition, and in what order.
// A Track can belong to more than one Edition (and more than one Album's
// Track union) at different positions.
export const editionTracks = pgTable(
  "edition_track",
  {
    id: serial("id").primaryKey(),
    editionId: integer("edition_id")
      .notNull()
      .references(() => editions.id, { onDelete: "cascade" }),
    trackId: integer("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    discNumber: integer("disc_number").default(1).notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    unique("edition_track_slot_unique").on(
      table.editionId,
      table.discNumber,
      table.position,
    ),
    index("edition_track_edition_id_idx").on(table.editionId),
    index("edition_track_track_id_idx").on(table.trackId),
  ],
);

export const trackDiaryEntries = pgTable(
  "track_diary_entry",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    trackId: integer("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    listenedDate: text("listened_date").notNull(),
    rating: real("rating"),
    relisten: boolean("relisten").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("track_diary_entry_user_id_idx").on(table.userId),
    index("track_diary_entry_track_id_idx").on(table.trackId),
  ],
);

export const trackInteractions = pgTable(
  "track_interaction",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    trackId: integer("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    liked: boolean("liked").default(false).notNull(),
    rating: real("rating"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("track_interactions_unique").on(table.userId, table.trackId),
    index("track_interaction_track_id_idx").on(table.trackId),
  ],
);
