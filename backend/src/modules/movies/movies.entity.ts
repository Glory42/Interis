import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core";

// We use the TMDB ID as the primary key so we never save duplicates.
export const movies = pgTable("movie", {
  id: integer("id").primaryKey(), 
  title: text("title").notNull(),
  posterPath: text("poster_path"), // e.g., "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"
  releaseDate: text("release_date"),
  overview: text("overview"),
  createdAt: timestamp("created_at").defaultNow(),
});