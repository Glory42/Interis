import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  jsonb,
  date,
  index,
} from "drizzle-orm/pg-core";

export const films = pgTable("movie", {
  id: serial("id").primaryKey(),
  tmdbId: integer("tmdb_id").notNull().unique(),
  title: text("title").notNull(),
  originalTitle: text("original_title"),
  posterPath: text("poster_path"),
  backdropPath: text("backdrop_path"),
  releaseDate: date("release_date"),
  releaseYear: integer("release_year"),
  director: text("director"),
  runtime: integer("runtime"),
  overview: text("overview"),
  tagline: text("tagline"),
  genres: jsonb("genres").$type<{ id: number; name: string }[]>(),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
}, (table) => [
  // Backs the admin "refresh the oldest cached titles" tool.
  index("movie_cached_at_idx").on(table.cachedAt),
]);
