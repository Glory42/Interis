import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { reviews } from "../../reviews/reviews.entity";
import { ReviewsRepository } from "../../reviews/repositories/reviews.repository";
import { serialEpisodeInteractions, serialSeasonInteractions } from "../serials.entity";
import { splitSeasonEpisodeReviewRows } from "../helpers/serials-season-episode-review-rows.helper";
import {
  SEASON_EPISODE_REVIEW_MEDIA_TYPES,
  TV_EPISODE_REVIEW_TYPE,
  TV_SEASON_REVIEW_TYPE,
  type SeasonEpisodeReviewMediaType,
} from "../../reviews/constants/review-media-type.constant";

export type SeasonEpisodeReviewInput = {
  content: string;
  containsSpoilers?: boolean;
  reviewId?: string;
  createNew?: boolean;
};

export type SerialSeasonEpisodeReviewRow = {
  id: string;
  userId: string;
  content: string;
  containsSpoilers: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorUsername: string;
  authorDisplayUsername: string | null;
  authorAvatarUrl: string | null;
  seasonNumber: number;
  episodeNumber: number | null;
  rating: number | null;
};

export class SerialsSeasonEpisodeReviewsRepository {
  // All season and episode reviews for a series, with each review's rating
  // resolved from serialSeasonInteractions/serialEpisodeInteractions (these
  // reviews are never linked to a diary entry - unlike series-level reviews,
  // their rating lives on the season/episode interaction row instead).
  static async getReviewRowsBySeriesId(
    tmdbId: number,
    seriesId: number,
  ): Promise<SerialSeasonEpisodeReviewRow[]> {
    const rows = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        mediaType: reviews.mediaType,
        mediaSourceId: reviews.mediaSourceId,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorAvatarUrl: profiles.avatarUrl,
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .leftJoin(profiles, eq(profiles.userId, reviews.userId))
      .where(
        and(
          inArray(reviews.mediaType, SEASON_EPISODE_REVIEW_MEDIA_TYPES),
          // mediaSourceId is "{tmdbId}:{season}[:{episode}]" - split_part
          // avoids a LIKE '${tmdbId}:%' false-positive (e.g. tmdbId 12
          // matching a stored "123:1").
          sql`split_part(${reviews.mediaSourceId}, ':', 1)::int = ${tmdbId}`,
        ),
      )
      .orderBy(desc(reviews.createdAt));

    if (rows.length === 0) {
      return [];
    }

    const { seasonRows, episodeRows } = splitSeasonEpisodeReviewRows(rows);

    const [seasonRatingRows, episodeRatingRows] = await Promise.all([
      seasonRows.length > 0
        ? db
            .select({
              userId: serialSeasonInteractions.userId,
              seasonNumber: serialSeasonInteractions.seasonNumber,
              rating: serialSeasonInteractions.rating,
            })
            .from(serialSeasonInteractions)
            .where(eq(serialSeasonInteractions.seriesId, seriesId))
        : Promise.resolve([]),
      episodeRows.length > 0
        ? db
            .select({
              userId: serialEpisodeInteractions.userId,
              seasonNumber: serialEpisodeInteractions.seasonNumber,
              episodeNumber: serialEpisodeInteractions.episodeNumber,
              rating: serialEpisodeInteractions.rating,
            })
            .from(serialEpisodeInteractions)
            .where(eq(serialEpisodeInteractions.seriesId, seriesId))
        : Promise.resolve([]),
    ]);

    const seasonRatingByKey = new Map(
      seasonRatingRows.map((row) => [`${row.userId}:${row.seasonNumber}`, row.rating]),
    );
    const episodeRatingByKey = new Map(
      episodeRatingRows.map((row) => [
        `${row.userId}:${row.seasonNumber}:${row.episodeNumber}`,
        row.rating,
      ]),
    );

    return [
      ...seasonRows.map((row) => ({
        id: row.id,
        userId: row.userId,
        content: row.content,
        containsSpoilers: row.containsSpoilers,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        authorUsername: row.authorUsername,
        authorDisplayUsername: row.authorDisplayUsername,
        authorAvatarUrl: row.authorAvatarUrl,
        seasonNumber: row.parsed.seasonNumber,
        episodeNumber: null,
        rating: seasonRatingByKey.get(`${row.userId}:${row.parsed.seasonNumber}`) ?? null,
      })),
      ...episodeRows.map((row) => ({
        id: row.id,
        userId: row.userId,
        content: row.content,
        containsSpoilers: row.containsSpoilers,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        authorUsername: row.authorUsername,
        authorDisplayUsername: row.authorDisplayUsername,
        authorAvatarUrl: row.authorAvatarUrl,
        seasonNumber: row.parsed.seasonNumber,
        episodeNumber: row.parsed.episodeNumber,
        rating:
          episodeRatingByKey.get(
            `${row.userId}:${row.parsed.seasonNumber}:${row.parsed.episodeNumber}`,
          ) ?? null,
      })),
    ];
  }

  // A user can have several reviews of one season/episode (#72). With no
  // reviewId / createNew these endpoints act on the newest one, so get, save
  // and delete go by owner + media source; season and episode reviews only
  // differ in mediaType and how their mediaSourceId is composed.
  private static async getReviewByMediaSource(
    userId: string,
    mediaType: SeasonEpisodeReviewMediaType,
    mediaSourceId: string,
    reviewId?: string,
  ) {
    const [row] = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.mediaType, mediaType),
          eq(reviews.mediaSourceId, mediaSourceId),
          reviewId ? eq(reviews.id, reviewId) : undefined,
        ),
      )
      .orderBy(desc(reviews.createdAt), desc(reviews.id))
      .limit(1);

    return row ?? null;
  }

  // Edits the review named by reviewId (null if it isn't this user's review
  // of this season/episode), writes a new one for createNew, and otherwise
  // edits the newest review or writes the first one.
  private static async saveReviewByMediaSource(
    userId: string,
    mediaType: SeasonEpisodeReviewMediaType,
    mediaSourceId: string,
    input: SeasonEpisodeReviewInput,
  ) {
    const existing = input.createNew
      ? null
      : await SerialsSeasonEpisodeReviewsRepository.getReviewByMediaSource(
          userId,
          mediaType,
          mediaSourceId,
          input.reviewId,
        );
    if (existing) {
      const row = await ReviewsRepository.updateByIdAndUser(existing.id, userId, {
        content: input.content,
        containsSpoilers: input.containsSpoilers ?? false,
      });
      return { row, isNew: false };
    }
    if (input.reviewId) {
      return { row: null, isNew: false };
    }

    const row = await ReviewsRepository.insertReviewRow({
      userId,
      mediaType,
      mediaSourceId,
      content: input.content,
      containsSpoilers: input.containsSpoilers ?? false,
    });
    return { row, isNew: true };
  }

  private static async deleteReviewByMediaSource(
    userId: string,
    mediaType: SeasonEpisodeReviewMediaType,
    mediaSourceId: string,
    reviewId?: string,
  ) {
    const target = await SerialsSeasonEpisodeReviewsRepository.getReviewByMediaSource(
      userId,
      mediaType,
      mediaSourceId,
      reviewId,
    );
    if (!target) return null;
    return ReviewsRepository.deleteByIdAndUser(target.id, userId);
  }

  static async getSeasonReview(userId: string, seriesTmdbId: number, seasonNumber: number) {
    return SerialsSeasonEpisodeReviewsRepository.getReviewByMediaSource(
      userId,
      TV_SEASON_REVIEW_TYPE,
      `${seriesTmdbId}:${seasonNumber}`,
    );
  }

  static async upsertSeasonReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    input: SeasonEpisodeReviewInput,
  ) {
    return SerialsSeasonEpisodeReviewsRepository.saveReviewByMediaSource(
      userId,
      TV_SEASON_REVIEW_TYPE,
      `${seriesTmdbId}:${seasonNumber}`,
      input,
    );
  }

  static async deleteSeasonReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    reviewId?: string,
  ) {
    return SerialsSeasonEpisodeReviewsRepository.deleteReviewByMediaSource(
      userId,
      TV_SEASON_REVIEW_TYPE,
      `${seriesTmdbId}:${seasonNumber}`,
      reviewId,
    );
  }

  static async getEpisodeReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
  ) {
    return SerialsSeasonEpisodeReviewsRepository.getReviewByMediaSource(
      userId,
      TV_EPISODE_REVIEW_TYPE,
      `${seriesTmdbId}:${seasonNumber}:${episodeNumber}`,
    );
  }

  static async upsertEpisodeReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
    input: SeasonEpisodeReviewInput,
  ) {
    return SerialsSeasonEpisodeReviewsRepository.saveReviewByMediaSource(
      userId,
      TV_EPISODE_REVIEW_TYPE,
      `${seriesTmdbId}:${seasonNumber}:${episodeNumber}`,
      input,
    );
  }

  static async deleteEpisodeReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
    reviewId?: string,
  ) {
    return SerialsSeasonEpisodeReviewsRepository.deleteReviewByMediaSource(
      userId,
      TV_EPISODE_REVIEW_TYPE,
      `${seriesTmdbId}:${seasonNumber}:${episodeNumber}`,
      reviewId,
    );
  }
}
