import { and, asc, count, desc, eq, isNotNull, isNull, or } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { films } from "../../films/films.entity";
import { filmInteractions } from "../../interactions/interactions.entity";
import { seriesInteractions, tvSeries } from "../../tv/tv.entity";
import { profiles } from "../../users/users.entity";
import type { OnboardingTitle } from "../types/onboarding.types";

export class OnboardingRepository {
  // All-time most watched or rated cached Films on Interis.
  static async findStapleFilms(limit: number): Promise<OnboardingTitle[]> {
    const rows = await db
      .select({
        tmdbId: films.tmdbId,
        title: films.title,
        posterPath: films.posterPath,
        year: films.releaseYear,
      })
      .from(filmInteractions)
      .innerJoin(films, eq(films.id, filmInteractions.movieId))
      .where(or(eq(filmInteractions.isWatched, true), isNotNull(filmInteractions.rating)))
      .groupBy(films.id)
      .orderBy(desc(count()), asc(films.id))
      .limit(limit);
    return rows.map((row) => ({ mediaType: "movie", ...row }));
  }

  static async findStapleSeries(limit: number): Promise<OnboardingTitle[]> {
    const rows = await db
      .select({
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        year: tvSeries.firstAirYear,
      })
      .from(seriesInteractions)
      .innerJoin(tvSeries, eq(tvSeries.id, seriesInteractions.seriesId))
      .where(or(eq(seriesInteractions.watchStatus, "completed"), isNotNull(seriesInteractions.rating)))
      .groupBy(tvSeries.id)
      .orderBy(desc(count()), asc(tvSeries.id))
      .limit(limit);
    return rows.map((row) => ({ mediaType: "tv", ...row }));
  }

  // Idempotent: a second call keeps the first completion time.
  static async markCompleted(userId: string): Promise<Date | null> {
    const [updated] = await db
      .update(profiles)
      .set({ onboardingCompletedAt: new Date() })
      .where(and(eq(profiles.userId, userId), isNull(profiles.onboardingCompletedAt)))
      .returning({ onboardingCompletedAt: profiles.onboardingCompletedAt });
    if (updated) return updated.onboardingCompletedAt;

    const [existing] = await db
      .select({ onboardingCompletedAt: profiles.onboardingCompletedAt })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    return existing?.onboardingCompletedAt ?? null;
  }
}
