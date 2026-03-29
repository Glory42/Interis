import { eq, and } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { movieInteractions } from "./interactions.entity";
import { activities } from "../social/social.entity";
import { MoviesService } from "../movies/movies.service";
import type { UpdateInteractionDto } from "./dto/interactions.dto";

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

    return (
      row ?? { userId, movieId: movie.id, liked: false, watchlisted: false }
    );
  }

  // Upsert — only update the fields sent
  static async update(
    userId: string,
    tmdbId: number,
    input: UpdateInteractionDto,
  ) {
    const movie = await MoviesService.findOrCreate(tmdbId);

    const [upserted] = await db
      .insert(movieInteractions)
      .values({
        userId,
        movieId: movie.id,
        liked: input.liked ?? false,
        watchlisted: input.watchlisted ?? false,
      })
      .onConflictDoUpdate({
        target: [movieInteractions.userId, movieInteractions.movieId],
        set: {
          ...(input.liked !== undefined && { liked: input.liked }),
          ...(input.watchlisted !== undefined && {
            watchlisted: input.watchlisted,
          }),
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
        .onConflictDoNothing(); // activities table has no unique — this is just defensive
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

    return upserted;
  }
}
