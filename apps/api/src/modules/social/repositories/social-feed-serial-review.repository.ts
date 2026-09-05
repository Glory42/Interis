import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { reviews } from "../../reviews/reviews.entity";
import {
  serialEpisodeInteractions,
  serialSeasonInteractions,
  tvSeries,
} from "../../serials/serials.entity";
import { splitSeasonEpisodeReviewRows } from "../../serials/helpers/serials-season-episode-review-rows.helper";
import { SEASON_EPISODE_REVIEW_MEDIA_TYPES } from "../../reviews/constants/review-media-type.constant";

export type SocialFeedSerialReviewRow = {
  id: string;
  diaryEntryId: null;
  reviewAuthorUsername: string;
  content: string;
  containsSpoilers: boolean;
  rating: number | null;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};

export class SocialFeedSerialReviewRepository {
  // Season/episode reviews for the given review ids, with their rating
  // resolved from serialSeasonInteractions/serialEpisodeInteractions (these
  // reviews are never linked to a diary entry, unlike series-level reviews -
  // their rating lives on the season/episode interaction row instead, keyed
  // by userId+seriesId+season[+episode]).
  static async getSeasonEpisodeReviewRows(
    reviewIds: string[],
  ): Promise<SocialFeedSerialReviewRow[]> {
    if (reviewIds.length === 0) {
      return [];
    }

    const rows = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        reviewAuthorUsername: user.username,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        mediaType: reviews.mediaType,
        mediaSourceId: reviews.mediaSourceId,
      })
      .from(reviews)
      .innerJoin(user, eq(reviews.userId, user.id))
      .where(
        and(
          inArray(reviews.mediaType, SEASON_EPISODE_REVIEW_MEDIA_TYPES),
          inArray(reviews.id, reviewIds),
        ),
      );

    if (rows.length === 0) {
      return [];
    }

    const { seasonRows, episodeRows } = splitSeasonEpisodeReviewRows(rows);

    const tmdbIds = [
      ...new Set([
        ...seasonRows.map((row) => row.parsed.tmdbId),
        ...episodeRows.map((row) => row.parsed.tmdbId),
      ]),
    ];

    const seriesRows = tmdbIds.length
      ? await db
          .select({
            id: tvSeries.id,
            tmdbId: tvSeries.tmdbId,
            title: tvSeries.title,
            posterPath: tvSeries.posterPath,
            releaseYear: tvSeries.firstAirYear,
          })
          .from(tvSeries)
          .where(inArray(tvSeries.tmdbId, tmdbIds))
      : [];
    const seriesByTmdbId = new Map(seriesRows.map((row) => [row.tmdbId, row]));

    const seasonSeriesIds = [
      ...new Set(
        seasonRows
          .map((row) => seriesByTmdbId.get(row.parsed.tmdbId)?.id)
          .filter((id): id is number => id !== undefined),
      ),
    ];
    const episodeSeriesIds = [
      ...new Set(
        episodeRows
          .map((row) => seriesByTmdbId.get(row.parsed.tmdbId)?.id)
          .filter((id): id is number => id !== undefined),
      ),
    ];

    const [seasonRatingRows, episodeRatingRows] = await Promise.all([
      seasonSeriesIds.length > 0
        ? db
            .select({
              userId: serialSeasonInteractions.userId,
              seriesId: serialSeasonInteractions.seriesId,
              seasonNumber: serialSeasonInteractions.seasonNumber,
              rating: serialSeasonInteractions.rating,
            })
            .from(serialSeasonInteractions)
            .where(inArray(serialSeasonInteractions.seriesId, seasonSeriesIds))
        : Promise.resolve([]),
      episodeSeriesIds.length > 0
        ? db
            .select({
              userId: serialEpisodeInteractions.userId,
              seriesId: serialEpisodeInteractions.seriesId,
              seasonNumber: serialEpisodeInteractions.seasonNumber,
              episodeNumber: serialEpisodeInteractions.episodeNumber,
              rating: serialEpisodeInteractions.rating,
            })
            .from(serialEpisodeInteractions)
            .where(inArray(serialEpisodeInteractions.seriesId, episodeSeriesIds))
        : Promise.resolve([]),
    ]);

    const seasonRatingByKey = new Map(
      seasonRatingRows.map((row) => [
        `${row.userId}:${row.seriesId}:${row.seasonNumber}`,
        row.rating,
      ]),
    );
    const episodeRatingByKey = new Map(
      episodeRatingRows.map((row) => [
        `${row.userId}:${row.seriesId}:${row.seasonNumber}:${row.episodeNumber}`,
        row.rating,
      ]),
    );

    return [
      ...seasonRows.map((row) => {
        const series = seriesByTmdbId.get(row.parsed.tmdbId);
        if (!series) return null;

        return {
          id: row.id,
          diaryEntryId: null,
          reviewAuthorUsername: row.reviewAuthorUsername,
          content: row.content,
          containsSpoilers: row.containsSpoilers,
          rating: seasonRatingByKey.get(`${row.userId}:${series.id}:${row.parsed.seasonNumber}`) ?? null,
          tmdbId: row.parsed.tmdbId,
          title: series.title,
          posterPath: series.posterPath,
          releaseYear: series.releaseYear,
        };
      }),
      ...episodeRows.map((row) => {
        const series = seriesByTmdbId.get(row.parsed.tmdbId);
        if (!series) return null;

        return {
          id: row.id,
          diaryEntryId: null,
          reviewAuthorUsername: row.reviewAuthorUsername,
          content: row.content,
          containsSpoilers: row.containsSpoilers,
          rating:
            episodeRatingByKey.get(
              `${row.userId}:${series.id}:${row.parsed.seasonNumber}:${row.parsed.episodeNumber}`,
            ) ?? null,
          tmdbId: row.parsed.tmdbId,
          title: series.title,
          posterPath: series.posterPath,
          releaseYear: series.releaseYear,
        };
      }),
    ].filter((row): row is NonNullable<typeof row> => row !== null);
  }
}
