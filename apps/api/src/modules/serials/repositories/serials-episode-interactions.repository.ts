import { eq, and, like, or, isNull, inArray, gt, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { serialEpisodeInteractions, serialInteractions, tvSeries } from "../serials.entity";
import { reviews } from "../../reviews/reviews.entity";
import { TV_EPISODE_REVIEW_TYPE } from "../../reviews/constants/review-media-type.constant";
import { SPECIALS_SEASON_NUMBER } from "../constants/serials-season.constants";

export class SerialsEpisodeInteractionsRepository {
  static async getViewerEpisodeInteractions(
    userId: string,
    seriesId: number,
    seriesTmdbId: number,
    seasonNumber: number,
  ) {
    const interactions = await db
      .select()
      .from(serialEpisodeInteractions)
      .where(
        and(
          eq(serialEpisodeInteractions.userId, userId),
          eq(serialEpisodeInteractions.seriesId, seriesId),
          eq(serialEpisodeInteractions.seasonNumber, seasonNumber),
        ),
      );

    const userReviews = await db
      .select({ mediaSourceId: reviews.mediaSourceId })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.mediaType, TV_EPISODE_REVIEW_TYPE),
          like(reviews.mediaSourceId, `${seriesTmdbId}:${seasonNumber}:%`),
        ),
      );

    const reviewEpisodeNumbers = new Set(
      userReviews
        .map((r) => {
          const parts = r.mediaSourceId.split(":");
          return Number(parts[2]);
        })
        .filter(Number.isInteger),
    );

    return interactions.map((i) => ({
      episodeNumber: i.episodeNumber,
      watched: i.watched,
      liked: i.liked,
      rating: i.rating,
      hasReview: reviewEpisodeNumbers.has(i.episodeNumber),
    }));
  }

  static async getSingleInteraction(
    userId: string,
    seriesId: number,
    seasonNumber: number,
    episodeNumber: number,
  ) {
    const [row] = await db
      .select()
      .from(serialEpisodeInteractions)
      .where(
        and(
          eq(serialEpisodeInteractions.userId, userId),
          eq(serialEpisodeInteractions.seriesId, seriesId),
          eq(serialEpisodeInteractions.seasonNumber, seasonNumber),
          eq(serialEpisodeInteractions.episodeNumber, episodeNumber),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  static async upsertEpisodeInteraction(input: {
    userId: string;
    seriesId: number;
    seasonNumber: number;
    episodeNumber: number;
    watched?: boolean;
    liked?: boolean;
    rating?: number | null;
  }) {
    const [row] = await db
      .insert(serialEpisodeInteractions)
      .values({
        userId: input.userId,
        seriesId: input.seriesId,
        seasonNumber: input.seasonNumber,
        episodeNumber: input.episodeNumber,
        watched: input.watched ?? false,
        liked: input.liked ?? false,
        rating: input.rating ?? null,
      })
      .onConflictDoUpdate({
        target: [
          serialEpisodeInteractions.userId,
          serialEpisodeInteractions.seriesId,
          serialEpisodeInteractions.seasonNumber,
          serialEpisodeInteractions.episodeNumber,
        ],
        set: {
          ...(input.watched !== undefined && { watched: input.watched }),
          ...(input.liked !== undefined && { liked: input.liked }),
          ...(input.rating !== undefined && { rating: input.rating }),
          updatedAt: new Date(),
        },
      })
      .returning();

    return row ?? null;
  }

  // Batches the whole-season "mark watched" cascade into a single
  // multi-row upsert instead of one upsert query per episode.
  static async upsertManyEpisodeWatchedState(input: {
    userId: string;
    seriesId: number;
    seasonNumber: number;
    episodeNumbers: number[];
    watched: boolean;
  }) {
    if (input.episodeNumbers.length === 0) {
      return [];
    }

    return db
      .insert(serialEpisodeInteractions)
      .values(
        input.episodeNumbers.map((episodeNumber) => ({
          userId: input.userId,
          seriesId: input.seriesId,
          seasonNumber: input.seasonNumber,
          episodeNumber,
          watched: input.watched,
        })),
      )
      .onConflictDoUpdate({
        target: [
          serialEpisodeInteractions.userId,
          serialEpisodeInteractions.seriesId,
          serialEpisodeInteractions.seasonNumber,
          serialEpisodeInteractions.episodeNumber,
        ],
        set: {
          watched: input.watched,
          updatedAt: new Date(),
        },
      })
      .returning();
  }

  // Finds series a user has started but not finished watching, in one
  // grouped query rather than scanning their whole watch history in the
  // application layer. Excludes series explicitly marked fully watched.
  static async getInProgressSeriesForUser(userId: string, limit: number) {
    return db
      .select({
        seriesId: tvSeries.id,
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        backdropPath: tvSeries.backdropPath,
        firstAirYear: tvSeries.firstAirYear,
        numberOfSeasons: tvSeries.numberOfSeasons,
        numberOfEpisodes: tvSeries.numberOfEpisodes,
        watchedEpisodesCount: sql<number>`count(*) filter (where ${serialEpisodeInteractions.watched})::int`,
        // updatedAt is a naive (no-timezone) column that always holds UTC
        // wall-clock digits; casting the aggregate result to timestamptz via
        // `AT TIME ZONE 'UTC'` makes Postgres return it with an explicit
        // offset, so the driver parses it as an unambiguous instant instead
        // of raw untyped text with no timezone marker at all.
        lastWatchedAt: sql<Date>`(max(${serialEpisodeInteractions.updatedAt}) filter (where ${serialEpisodeInteractions.watched})) at time zone 'UTC'`,
      })
      .from(serialEpisodeInteractions)
      .innerJoin(tvSeries, eq(serialEpisodeInteractions.seriesId, tvSeries.id))
      .leftJoin(
        serialInteractions,
        and(
          eq(serialInteractions.userId, serialEpisodeInteractions.userId),
          eq(serialInteractions.seriesId, serialEpisodeInteractions.seriesId),
        ),
      )
      .where(
        and(
          eq(serialEpisodeInteractions.userId, userId),
          or(isNull(serialInteractions.isWatched), eq(serialInteractions.isWatched, false)),
        ),
      )
      .groupBy(tvSeries.id)
      .having(
        sql`count(*) filter (where ${serialEpisodeInteractions.watched}) > 0
          and count(*) filter (where ${serialEpisodeInteractions.watched}) < ${tvSeries.numberOfEpisodes}`,
      )
      .orderBy(sql`max(${serialEpisodeInteractions.updatedAt}) filter (where ${serialEpisodeInteractions.watched}) desc`)
      .limit(limit);
  }

  // Per-series watched-episode counts for a viewer, batched across a page
  // of archive items (one grouped query instead of one per card) - used to
  // tell "still watching" (some but not all episodes watched) apart from
  // "fully watched" on the archive grid. Excludes SPECIALS_SEASON_NUMBER,
  // matching the same isNonSpecialSeasonNumber filter used elsewhere when
  // computing the same "fully watched" concept.
  static async getViewerWatchedEpisodeCountsByTmdbIds(userId: string, tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    return db
      .select({
        tmdbId: tvSeries.tmdbId,
        watchedEpisodesCount: sql<number>`count(*) filter (where ${serialEpisodeInteractions.watched})::int`,
      })
      .from(serialEpisodeInteractions)
      .innerJoin(tvSeries, eq(serialEpisodeInteractions.seriesId, tvSeries.id))
      .where(
        and(
          eq(serialEpisodeInteractions.userId, userId),
          gt(serialEpisodeInteractions.seasonNumber, SPECIALS_SEASON_NUMBER),
          inArray(tvSeries.tmdbId, uniqueTmdbIds),
        ),
      )
      .groupBy(tvSeries.tmdbId);
  }

  static async getAllViewerEpisodeInteractions(
    userId: string,
    seriesId: number,
    seriesTmdbId: number,
  ) {
    const interactions = await db
      .select()
      .from(serialEpisodeInteractions)
      .where(
        and(
          eq(serialEpisodeInteractions.userId, userId),
          eq(serialEpisodeInteractions.seriesId, seriesId),
        ),
      );

    const userReviews = await db
      .select({ mediaSourceId: reviews.mediaSourceId })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.mediaType, TV_EPISODE_REVIEW_TYPE),
          like(reviews.mediaSourceId, `${seriesTmdbId}:%`),
        ),
      );

    const reviewKeys = new Set(
      userReviews.map((r) => r.mediaSourceId),
    );

    return interactions.map((i) => {
      const key = `${seriesTmdbId}:${i.seasonNumber}:${i.episodeNumber}`;
      return {
        seasonNumber: i.seasonNumber,
        episodeNumber: i.episodeNumber,
        watched: i.watched,
        liked: i.liked,
        rating: i.rating,
        hasReview: reviewKeys.has(key),
      };
    });
  }
}
