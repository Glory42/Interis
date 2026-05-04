import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";

export const tvSeries = pgTable("tv_series", {
  id: serial("id").primaryKey(),
  tmdbId: integer("tmdb_id").notNull().unique(),
  title: text("title").notNull(),
  originalTitle: text("original_title"),
  posterPath: text("poster_path"),
  backdropPath: text("backdrop_path"),
  firstAirDate: date("first_air_date"),
  firstAirYear: integer("first_air_year"),
  lastAirDate: date("last_air_date"),
  creator: text("creator"),
  network: text("network"),
  episodeRuntime: integer("episode_runtime"),
  numberOfSeasons: integer("number_of_seasons"),
  numberOfEpisodes: integer("number_of_episodes"),
  status: text("status"),
  overview: text("overview"),
  tagline: text("tagline"),
  languageCode: text("language_code"),
  genres: jsonb("genres").$type<{ id: number; name: string }[]>(),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
});

export const serialDiaryEntries = pgTable("serial_diary_entry", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  seriesId: integer("series_id")
    .notNull()
    .references(() => tvSeries.id, { onDelete: "cascade" }),
  watchedDate: date("watched_date").notNull(),
  rating: integer("rating"),
  rewatch: boolean("rewatch").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const serialInteractions = pgTable(
  "serial_interaction",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    seriesId: integer("series_id")
      .notNull()
      .references(() => tvSeries.id, { onDelete: "cascade" }),
    liked: boolean("liked").default(false).notNull(),
    watchlisted: boolean("watchlisted").default(false).notNull(),
    rating: integer("rating"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [unique("serial_interactions_unique").on(table.userId, table.seriesId)],
);
