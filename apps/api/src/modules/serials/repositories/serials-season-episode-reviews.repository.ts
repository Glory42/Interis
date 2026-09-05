import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { reviews } from "../../reviews/reviews.entity";
import { serialEpisodeInteractions, serialSeasonInteractions } from "../serials.entity";
import { parseEpisodeMediaSourceId, parseSeasonMediaSourceId } from "../helpers/serials-media-source.helper";
import {
  SEASON_EPISODE_REVIEW_MEDIA_TYPES,
  TV_EPISODE_REVIEW_TYPE,
  TV_SEASON_REVIEW_TYPE,
  type SeasonEpisodeReviewMediaType,
} from "../../reviews/constants/review-media-type.constant";

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

    const seasonRows = rows
      .filter((row) => row.mediaType === TV_SEASON_REVIEW_TYPE)
      .map((row) => ({ ...row, parsed: parseSeasonMediaSourceId(row.mediaSourceId) }))
      .filter(
        (row): row is typeof row & { parsed: NonNullable<typeof row.parsed> } =>
          row.parsed !== null,
      );
    const episodeRows = rows
      .filter((row) => row.mediaType === TV_EPISODE_REVIEW_TYPE)
      .map((row) => ({ ...row, parsed: parseEpisodeMediaSourceId(row.mediaSourceId) }))
      .filter(
        (row): row is typeof row & { parsed: NonNullable<typeof row.parsed> } =>
          row.parsed !== null,
      );

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

  // Single season/episode review persistence (get/upsert/delete by owner +
  // media source) - season and episode reviews only differ in mediaType and
  // how their mediaSourceId is composed, so the CRUD itself is shared here.
  private static async getReviewByMediaSource(
    userId: string,
    mediaType: SeasonEpisodeReviewMediaType,
    mediaSourceId: string,
  ) {
    const [row] = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.mediaType, mediaType),
          eq(reviews.mediaSourceId, mediaSourceId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  private static async upsertReviewByMediaSource(
    userId: string,
    mediaType: SeasonEpisodeReviewMediaType,
    mediaSourceId: string,
    input: { content: string; containsSpoilers?: boolean },
  ) {
    const [existing] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.mediaType, mediaType),
          eq(reviews.mediaSourceId, mediaSourceId),
        ),
      )
      .limit(1);
    const isNew = !existing;

    const [row] = await db
      .insert(reviews)
      .values({
        userId,
        mediaType,
        mediaSourceId,
        content: input.content,
        containsSpoilers: input.containsSpoilers ?? false,
      })
      .onConflictDoUpdate({
        target: [reviews.userId, reviews.mediaType, reviews.mediaSource, reviews.mediaSourceId],
        set: {
          content: input.content,
          containsSpoilers: input.containsSpoilers ?? false,
          updatedAt: new Date(),
        },
      })
      .returning();

    return { row: row ?? null, isNew };
  }

  private static async deleteReviewByMediaSource(
    userId: string,
    mediaType: SeasonEpisodeReviewMediaType,
    mediaSourceId: string,
  ) {
    const [deleted] = await db
      .delete(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.mediaType, mediaType),
          eq(reviews.mediaSourceId, mediaSourceId),
        ),
      )
      .returning();

    return deleted ?? null;
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
    input: { content: string; containsSpoilers?: boolean },
  ) {
    return SerialsSeasonEpisodeReviewsRepository.upsertReviewByMediaSource(
      userId,
      TV_SEASON_REVIEW_TYPE,
      `${seriesTmdbId}:${seasonNumber}`,
      input,
    );
  }

  static async deleteSeasonReview(userId: string, seriesTmdbId: number, seasonNumber: number) {
    return SerialsSeasonEpisodeReviewsRepository.deleteReviewByMediaSource(
      userId,
      TV_SEASON_REVIEW_TYPE,
      `${seriesTmdbId}:${seasonNumber}`,
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
    input: { content: string; containsSpoilers?: boolean },
  ) {
    return SerialsSeasonEpisodeReviewsRepository.upsertReviewByMediaSource(
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
  ) {
    return SerialsSeasonEpisodeReviewsRepository.deleteReviewByMediaSource(
      userId,
      TV_EPISODE_REVIEW_TYPE,
      `${seriesTmdbId}:${seasonNumber}:${episodeNumber}`,
    );
  }
}
