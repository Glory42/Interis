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

  static async hasRating(userId: string, movieId: number): Promise<boolean> {
    const [row] = await db
      .select({ rating: movieInteractions.rating })
      .from(movieInteractions)
      .where(and(eq(movieInteractions.userId, userId), eq(movieInteractions.movieId, movieId)))
      .limit(1);

    return row?.rating !== null && row?.rating !== undefined;
  }
}
