import { and, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { movieInteractions } from "../interactions.entity";

type WritableInteractionField = "isWatched" | "watchlisted" | "rating";

type InteractionFieldValue<TField extends WritableInteractionField> = TField extends "rating"
  ? number
  : boolean;

export class InteractionsRepository {
  static async findByUserAndMovie(userId: string, movieId: number) {
    const [row] = await db
      .select()
      .from(movieInteractions)
      .where(and(eq(movieInteractions.userId, userId), eq(movieInteractions.movieId, movieId)))
      .limit(1);

    return row ?? null;
  }

  // Upsert for the multi-field partial-update flow (InteractionsService.update):
  // insert defaults prefer the explicit `watched` flag over the implicit-watch
  // signal, but on conflict the implicit-watch signal wins over an explicit
  // `watched` value - this asymmetry is intentional in the existing behavior,
  // kept verbatim rather than folded into a single generic path.
  //
  // Liking, rating, or marking watched implies the movie is no longer
  // "to watch" - auto-clear watchlisted alongside it, unless the caller sent
  // an explicit watchlisted value in the same request (that always wins).
  static async upsertInteractionState(
    userId: string,
    movieId: number,
    input: {
      liked?: boolean;
      watchlisted?: boolean;
      rating?: number | null;
      watched?: boolean;
      isImplicitlyWatched: boolean;
    },
  ) {
    const shouldAutoClearWatchlist =
      input.watchlisted === undefined &&
      (input.liked === true || input.watched === true || input.isImplicitlyWatched);

    const [row] = await db
      .insert(movieInteractions)
      .values({
        userId,
        movieId,
        liked: input.liked ?? false,
        watchlisted: input.watchlisted ?? false,
        rating: input.rating ?? null,
        isWatched: input.watched ?? input.isImplicitlyWatched ?? false,
      })
      .onConflictDoUpdate({
        target: [movieInteractions.userId, movieInteractions.movieId],
        set: {
          ...(input.liked !== undefined && { liked: input.liked }),
          ...(input.watchlisted !== undefined && { watchlisted: input.watchlisted }),
          ...(shouldAutoClearWatchlist && { watchlisted: false }),
          ...(input.rating !== undefined && { rating: input.rating ?? null }),
          ...(input.watched !== undefined && { isWatched: input.watched }),
          ...(input.isImplicitlyWatched && { isWatched: true }),
        },
      })
      .returning();

    return row;
  }

  static async upsertField<TField extends WritableInteractionField>(
    userId: string,
    movieId: number,
    field: TField,
    value: InteractionFieldValue<TField>,
  ): Promise<void> {
    await db
      .insert(movieInteractions)
      .values({ userId, movieId, liked: false, watchlisted: false, [field]: value })
      .onConflictDoUpdate({
        target: [movieInteractions.userId, movieInteractions.movieId],
        set: { [field]: value },
      });
  }

  // Marking a movie watched (diary log, standalone review) always implies
  // it's no longer on the watchlist.
  static async markWatched(userId: string, movieId: number): Promise<void> {
    await db
      .insert(movieInteractions)
      .values({ userId, movieId, liked: false, watchlisted: false, isWatched: true })
      .onConflictDoUpdate({
        target: [movieInteractions.userId, movieInteractions.movieId],
        set: { isWatched: true, watchlisted: false },
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
