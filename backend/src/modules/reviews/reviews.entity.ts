import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";
import { movies } from "../movies/movies.entity";

export const reviews = pgTable("review", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  // If a user is deleted, their reviews are cascade-deleted
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), 
  // If a movie is deleted from the cache, the reviews go with it
  movieId: integer("movie_id").notNull().references(() => movies.id, { onDelete: "cascade" }), 
  rating: integer("rating").notNull(), // 1 to 5 stars
  content: text("content"), // The written text
  createdAt: timestamp("created_at").defaultNow(),
});

export const follows = pgTable("follow", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  followerId: text("follower_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  followingId: text("following_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});