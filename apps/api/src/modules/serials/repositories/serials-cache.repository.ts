import { eq, inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { tvSeries } from "../serials.entity";

export class SerialsCacheRepository {
  static async findByTmdbId(tmdbId: number) {
    const [existing] = await db
      .select()
      .from(tvSeries)
      .where(eq(tvSeries.tmdbId, tmdbId))
      .limit(1);

    return existing ?? null;
  }

  static async findByTmdbIds(tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];

    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    return db
      .select()
      .from(tvSeries)
      .where(inArray(tvSeries.tmdbId, uniqueTmdbIds));
  }

  static async upsertCachedSeries(input: {
    tmdbId: number;
    title: string;
    originalTitle: string | null;
    posterPath: string | null;
    backdropPath: string | null;
    firstAirDate: string | null;
    firstAirYear: number | null;
    lastAirDate: string | null;
    creator: string | null;
    network: string | null;
    episodeRuntime: number | null;
    numberOfSeasons: number | null;
    numberOfEpisodes: number | null;
    status: string | null;
    overview: string | null;
    tagline: string | null;
    languageCode: string | null;
    genres: { id: number; name: string }[];
  }) {
    const [inserted] = await db
      .insert(tvSeries)
      .values({
        tmdbId: input.tmdbId,
        title: input.title,
        originalTitle: input.originalTitle,
        posterPath: input.posterPath,
        backdropPath: input.backdropPath,
        firstAirDate: input.firstAirDate,
        firstAirYear: input.firstAirYear,
        lastAirDate: input.lastAirDate,
        creator: input.creator,
        network: input.network,
        episodeRuntime: input.episodeRuntime,
        numberOfSeasons: input.numberOfSeasons,
        numberOfEpisodes: input.numberOfEpisodes,
        status: input.status,
        overview: input.overview,
        tagline: input.tagline,
        languageCode: input.languageCode,
        genres: input.genres,
      })
      .onConflictDoUpdate({
        target: tvSeries.tmdbId,
        set: {
          title: input.title,
          originalTitle: input.originalTitle,
          posterPath: input.posterPath,
          backdropPath: input.backdropPath,
          firstAirDate: input.firstAirDate,
          firstAirYear: input.firstAirYear,
          lastAirDate: input.lastAirDate,
          creator: input.creator,
          network: input.network,
          episodeRuntime: input.episodeRuntime,
          numberOfSeasons: input.numberOfSeasons,
          numberOfEpisodes: input.numberOfEpisodes,
          status: input.status,
          overview: input.overview,
          tagline: input.tagline,
          languageCode: input.languageCode,
          genres: input.genres,
          cachedAt: new Date(),
        },
      })
      .returning();

    return inserted ?? null;
  }
}
