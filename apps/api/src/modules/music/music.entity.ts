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
  // Last.fm popularity enrichment - MusicBrainz has no listen/popularity
  // signal of its own. Lazily refreshed (see MusicCacheService), never
  // blocking the base album fetch on it.
  lastfmListeners: integer("lastfm_listeners"),
  lastfmPlaycount: integer("lastfm_playcount"),
  lastfmFetchedAt: timestamp("lastfm_fetched_at"),
});

// TTL-cached "Trending" chart for the Music archive - Last.fm has no direct
// top-albums endpoint, so this stores the already-resolved (top artist's top
// album -> MusicBrainz release-group mbid) list, mirroring the NYT
// bestseller cache's role for Books. See LastfmTrendingCacheService.
export const lastfmTrendingCache = pgTable("lastfm_trending_cache", {
  id: serial("id").primaryKey(),
  chartKey: text("chart_key").notNull().unique(),
  items: jsonb("items")
    .$type<Array<{ artistName: string; albumTitle: string; mbid: string }>>()
    .notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
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
  // 30-second preview clip resolved from iTunes Search (no auth required).
  // Not present on MusicBrainz/Last.fm, so this is the one field we sourced
  // from a third catalog. previewFetchedAt tracks whether we've ever tried,
  // independent of whether iTunes actually had a match.
  previewUrl: text("preview_url"),
  previewFetchedAt: timestamp("preview_fetched_at"),
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
    wantToListen: boolean("want_to_listen").default(false).notNull(),
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
