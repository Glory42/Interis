import { eq, and } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { movieInteractions } from "./interactions.entity";
import { activities } from "../social/social.entity";
import { MoviesService } from "../movies/movies.service";
import type { UpdateInteractionDto } from "./dto/interactions.dto";

const toInteractionResponse = (row: {
  liked: boolean;
  watchlisted: boolean;
  rating: number | null;
  isWatched: boolean;
}) => {
  return {
    liked: row.liked,
    watchlisted: row.watchlisted,
    rating: row.rating,
    watched: row.isWatched,
  };
};

export class InteractionsService {
  // GET current state — null means no row yet (both false)
  static async get(userId: string, tmdbId: number) {
    const movie = await MoviesService.findOrCreate(tmdbId);

    const [row] = await db
      .select()
      .from(movieInteractions)
      .where(
        and(
          eq(movieInteractions.userId, userId),
          eq(movieInteractions.movieId, movie.id),
        ),
      )
      .limit(1);

    return toInteractionResponse(
      row ?? {
        liked: false,
        watchlisted: false,
        rating: null,
        isWatched: false,
      },
    );
  }

  // Upsert — only update the fields sent
  static async update(
    userId: string,
    tmdbId: number,
    input: UpdateInteractionDto,
  ) {
    const movie = await MoviesService.findOrCreate(tmdbId);
    const rating = input.rating;

    // Implicit watch if user liked or rated the movie
    const isImplicitlyWatched =
      input.liked === true ||
      (input.rating !== undefined && input.rating !== null);

    const [upserted] = await db
      .insert(movieInteractions)
      .values({
        userId,
        movieId: movie.id,
        liked: input.liked ?? false,
        watchlisted: input.watchlisted ?? false,
        rating: rating ?? null,
        isWatched: input.watched ?? isImplicitlyWatched ?? false,
      })
      .onConflictDoUpdate({
        target: [movieInteractions.userId, movieInteractions.movieId],
        set: {
          ...(input.liked !== undefined && { liked: input.liked }),
          ...(input.watchlisted !== undefined && {
            watchlisted: input.watchlisted,
          }),
          ...(input.rating !== undefined && {
            rating: rating ?? null,
          }),
          ...(input.watched !== undefined && { isWatched: input.watched }),
          ...(isImplicitlyWatched && { isWatched: true }),
        },
      })
      .returning();

    // Write activity only for meaningful state changes
    if (input.liked === true) {
      await db
        .insert(activities)
        .values({
          userId,
          type: "liked_movie",
          entityId: String(movie.id),
          metadata: JSON.stringify({
            movieId: movie.id,
            tmdbId: movie.tmdbId,
            title: movie.title,
            posterPath: movie.posterPath,
          }),
        })
        .onConflictDoNothing();
    }

    if (input.watchlisted === true) {
      await db.insert(activities).values({
        userId,
        type: "watchlisted_movie",
        entityId: String(movie.id),
        metadata: JSON.stringify({
          movieId: movie.id,
          tmdbId: movie.tmdbId,
          title: movie.title,
          posterPath: movie.posterPath,
        }),
      });
    }

    return toInteractionResponse(
      upserted ?? {
        liked: input.liked ?? false,
        watchlisted: input.watchlisted ?? false,
        rating: rating ?? null,
        isWatched: input.watched ?? isImplicitlyWatched ?? false,
      },
    );
  }

  static async setWatchlisted(userId: string, movieId: number): Promise<void> {
    await db
      .insert(movieInteractions)
      .values({ userId, movieId, liked: false, watchlisted: true })
      .onConflictDoUpdate({
        target: [movieInteractions.userId, movieInteractions.movieId],
        set: { watchlisted: true },
      });
  }

  static async setRating(userId: string, movieId: number, ratingOutOfTen: number): Promise<void> {
    await db
      .insert(movieInteractions)
      .values({ userId, movieId, liked: false, watchlisted: false, rating: ratingOutOfTen })
      .onConflictDoUpdate({
        target: [movieInteractions.userId, movieInteractions.movieId],
        set: { rating: ratingOutOfTen },
      });
  }

  static async hasRating(userId: string, movieId: number): Promise<boolean> {
    const [row] = await db
      .select({ rating: movieInteractions.rating })
      .from(movieInteractions)
      .where(and(eq(movieInteractions.userId, userId), eq(movieInteractions.movieId, movieId)))
      .limit(1);
    return row?.rating !== null && row?.rating !== undefined;
  }
}
