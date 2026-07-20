import { desc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { tvSeries } from "../serials.entity";

export type AdminUpdateSeriesFields = Partial<{
  title: string;
  originalTitle: string | null;
  overview: string | null;
  tagline: string | null;
  creator: string | null;
  network: string | null;
  posterPath: string | null;
  backdropPath: string | null;
}>;

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

  static async findById(id: number) {
    const [existing] = await db.select().from(tvSeries).where(eq(tvSeries.id, id)).limit(1);
    return existing ?? null;
  }

  static async listAllForAdmin(query: string | undefined, limit: number, offset: number) {
    return db
      .select({
        id: tvSeries.id,
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        originalTitle: tvSeries.originalTitle,
        posterPath: tvSeries.posterPath,
        firstAirYear: tvSeries.firstAirYear,
        creator: tvSeries.creator,
        cachedAt: tvSeries.cachedAt,
      })
      .from(tvSeries)
      .where(query ? ilike(tvSeries.title, `%${query}%`) : undefined)
      .orderBy(desc(tvSeries.cachedAt))
      .limit(limit)
      .offset(offset);
  }

  static async updateById(id: number, fields: AdminUpdateSeriesFields) {
    const [updated] = await db.update(tvSeries).set(fields).where(eq(tvSeries.id, id)).returning();
    return updated ?? null;
  }

  // Cascades to every serial diary entry/interaction/season/episode
  // interaction and list entry across all users — admin moderation only.
  static async deleteById(id: number) {
    const [deleted] = await db
      .delete(tvSeries)
      .where(eq(tvSeries.id, id))
      .returning({ id: tvSeries.id });
    return deleted ?? null;
  }
}
