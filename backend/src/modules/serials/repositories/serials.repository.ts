import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import {
  comments,
  reviewLikes,
  reviews,
} from "../../reviews/reviews.entity";
import { profiles } from "../../users/users.entity";
import {
  serialDiaryEntries,
  serialInteractions,
  tvSeries,
} from "../serials.entity";

export class SerialsRepository {
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

  static async getLogsCountBySeriesId(seriesId: number): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int`.as("count") })
      .from(serialDiaryEntries)
      .where(eq(serialDiaryEntries.seriesId, seriesId))
      .limit(1);

    return row?.count ?? 0;
  }

  static async getReviewRowsBySeriesId(seriesId: number) {
    const [series] = await db
      .select({ tmdbId: tvSeries.tmdbId })
      .from(tvSeries)
      .where(eq(tvSeries.id, seriesId))
      .limit(1);

    if (!series) {
      return [];
    }

    return db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        watchedDate: serialDiaryEntries.watchedDate,
        ratingOutOfTen: serialDiaryEntries.rating,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorImage: user.image,
        authorAvatarUrl: profiles.avatarUrl,
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .leftJoin(profiles, eq(profiles.userId, reviews.userId))
      .leftJoin(serialDiaryEntries, eq(serialDiaryEntries.id, reviews.diaryEntryId))
      .where(
        and(
          eq(reviews.mediaType, "tv"),
          eq(reviews.mediaSource, "tmdb"),
          eq(reviews.mediaSourceId, String(series.tmdbId)),
        ),
      )
      .orderBy(desc(reviews.createdAt));
  }

  static async getReviewLikeCounts(reviewIds: string[]) {
    if (reviewIds.length === 0) {
      return [];
    }

    return db
      .select({
        reviewId: reviewLikes.reviewId,
        likeCount: sql<number>`count(*)::int`.as("likeCount"),
      })
      .from(reviewLikes)
      .where(inArray(reviewLikes.reviewId, reviewIds))
      .groupBy(reviewLikes.reviewId);
  }

  static async getReviewCommentCounts(reviewIds: string[]) {
    if (reviewIds.length === 0) {
      return [];
    }

    return db
      .select({
        reviewId: comments.reviewId,
        commentCount: sql<number>`count(*)::int`.as("commentCount"),
      })
      .from(comments)
      .where(inArray(comments.reviewId, reviewIds))
      .groupBy(comments.reviewId);
  }

  static async getViewerLikedReviewRows(viewerUserId: string, reviewIds: string[]) {
    if (reviewIds.length === 0) {
      return [];
    }

    return db
      .select({ reviewId: reviewLikes.reviewId })
      .from(reviewLikes)
      .where(
        and(
          eq(reviewLikes.userId, viewerUserId),
          inArray(reviewLikes.reviewId, reviewIds),
        ),
      );
  }

  static async getReviewWithSeries(reviewId: string) {
    const [reviewRow] = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        reviewAuthorUsername: user.username,
        mediaType: reviews.mediaType,
        mediaSourceId: reviews.mediaSourceId,
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!reviewRow || reviewRow.mediaType !== "tv") {
      return null;
    }

    const tmdbId = Number(reviewRow.mediaSourceId);
    if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
      return null;
    }

    const [seriesRow] = await db
      .select({
        id: tvSeries.id,
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        firstAirYear: tvSeries.firstAirYear,
      })
      .from(tvSeries)
      .where(eq(tvSeries.tmdbId, tmdbId))
      .limit(1);

    if (!seriesRow) {
      return null;
    }

    return {
      id: reviewRow.id,
      userId: reviewRow.userId,
      reviewAuthorUsername: reviewRow.reviewAuthorUsername,
      seriesId: seriesRow.id,
      tmdbId: seriesRow.tmdbId,
      title: seriesRow.title,
      posterPath: seriesRow.posterPath,
      firstAirYear: seriesRow.firstAirYear,
    };
  }

  static async insertReviewLike(userId: string, reviewId: string) {
    const [row] = await db
      .insert(reviewLikes)
      .values({ userId, reviewId })
      .onConflictDoNothing()
      .returning({ reviewId: reviewLikes.reviewId });

    return row ?? null;
  }

  static async deleteReviewLikeByUser(userId: string, reviewId: string) {
    const [row] = await db
      .delete(reviewLikes)
      .where(
        and(
          eq(reviewLikes.userId, userId),
          eq(reviewLikes.reviewId, reviewId),
        ),
      )
      .returning({ reviewId: reviewLikes.reviewId });

    return row ?? null;
  }

  static async getReviewCommentsByReviewId(reviewId: string) {
    return db
      .select({
        id: comments.id,
        userId: comments.userId,
        reviewId: comments.reviewId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorAvatarUrl: profiles.avatarUrl,
        authorImage: user.image,
      })
      .from(comments)
      .innerJoin(user, eq(comments.userId, user.id))
      .leftJoin(profiles, eq(comments.userId, profiles.userId))
      .where(eq(comments.reviewId, reviewId))
      .orderBy(comments.createdAt);
  }

  static async insertReviewComment(input: {
    userId: string;
    reviewId: string;
    content: string;
  }) {
    const [comment] = await db
      .insert(comments)
      .values({
        userId: input.userId,
        reviewId: input.reviewId,
        content: input.content,
      })
      .returning();

    return comment ?? null;
  }

  static async getReviewCommentWithAuthorById(commentId: string) {
    const [row] = await db
      .select({
        id: comments.id,
        userId: comments.userId,
        reviewId: comments.reviewId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorAvatarUrl: profiles.avatarUrl,
        authorImage: user.image,
      })
      .from(comments)
      .innerJoin(user, eq(comments.userId, user.id))
      .leftJoin(profiles, eq(comments.userId, profiles.userId))
      .where(eq(comments.id, commentId))
      .limit(1);

    return row ?? null;
  }

  static async getReviewMetadataForActivity(reviewId: string) {
    const [reviewRow] = await db
      .select({
        reviewId: reviews.id,
        reviewAuthorUsername: user.username,
        mediaType: reviews.mediaType,
        mediaSourceId: reviews.mediaSourceId,
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!reviewRow || reviewRow.mediaType !== "tv") {
      return null;
    }

    const tmdbId = Number(reviewRow.mediaSourceId);
    if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
      return null;
    }

    const [seriesRow] = await db
      .select({
        seriesId: tvSeries.id,
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        firstAirYear: tvSeries.firstAirYear,
      })
      .from(tvSeries)
      .where(eq(tvSeries.tmdbId, tmdbId))
      .limit(1);

    if (!seriesRow) {
      return null;
    }

    return {
      reviewId: reviewRow.reviewId,
      reviewAuthorUsername: reviewRow.reviewAuthorUsername,
      seriesId: seriesRow.seriesId,
      tmdbId: seriesRow.tmdbId,
      title: seriesRow.title,
      posterPath: seriesRow.posterPath,
      firstAirYear: seriesRow.firstAirYear,
    };
  }

  static async getViewerDiaryRows(viewerUserId: string, seriesId: number) {
    return db
      .select({
        id: serialDiaryEntries.id,
        watchedDate: serialDiaryEntries.watchedDate,
        rewatch: serialDiaryEntries.rewatch,
        ratingOutOfTen: serialDiaryEntries.rating,
      })
      .from(serialDiaryEntries)
      .where(
        and(
          eq(serialDiaryEntries.userId, viewerUserId),
          eq(serialDiaryEntries.seriesId, seriesId),
        ),
      )
      .orderBy(desc(serialDiaryEntries.watchedDate), desc(serialDiaryEntries.createdAt))
      .limit(1);
  }

  static async getViewerReviewRows(viewerUserId: string, seriesId: number) {
    const [series] = await db
      .select({ tmdbId: tvSeries.tmdbId })
      .from(tvSeries)
      .where(eq(tvSeries.id, seriesId))
      .limit(1);

    if (!series) {
      return [];
    }

    return db
      .select({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, viewerUserId),
          eq(reviews.mediaType, "tv"),
          eq(reviews.mediaSource, "tmdb"),
          eq(reviews.mediaSourceId, String(series.tmdbId)),
        ),
      )
      .limit(1);
  }

  static async getViewerLoggedTmdbIds(viewerUserId: string, tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    const [loggedRows, ratedRows] = await Promise.all([
      db
        .select({ tmdbId: tvSeries.tmdbId })
        .from(serialDiaryEntries)
        .innerJoin(tvSeries, eq(serialDiaryEntries.seriesId, tvSeries.id))
        .where(
          and(
            eq(serialDiaryEntries.userId, viewerUserId),
            inArray(tvSeries.tmdbId, uniqueTmdbIds),
          ),
        )
        .groupBy(tvSeries.tmdbId),
      db
        .select({ tmdbId: tvSeries.tmdbId })
        .from(serialInteractions)
        .innerJoin(tvSeries, eq(serialInteractions.seriesId, tvSeries.id))
        .where(
          and(
            eq(serialInteractions.userId, viewerUserId),
            inArray(tvSeries.tmdbId, uniqueTmdbIds),
            sql`${serialInteractions.rating} is not null`,
          ),
        )
        .groupBy(tvSeries.tmdbId),
    ]);

    return [...new Set([...loggedRows, ...ratedRows].map((row) => row.tmdbId))];
  }

  static async getViewerWatchlistedTmdbIds(viewerUserId: string, tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    const rows = await db
      .select({ tmdbId: tvSeries.tmdbId })
      .from(serialInteractions)
      .innerJoin(tvSeries, eq(serialInteractions.seriesId, tvSeries.id))
      .where(
        and(
          eq(serialInteractions.userId, viewerUserId),
          eq(serialInteractions.watchlisted, true),
          inArray(tvSeries.tmdbId, uniqueTmdbIds),
        ),
      )
      .groupBy(tvSeries.tmdbId);

    return rows.map((row) => row.tmdbId);
  }

  static async getInteractionRow(userId: string, seriesId: number) {
    const [row] = await db
      .select()
      .from(serialInteractions)
      .where(
        and(
          eq(serialInteractions.userId, userId),
          eq(serialInteractions.seriesId, seriesId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  static async upsertInteraction(input: {
    userId: string;
    seriesId: number;
    liked?: boolean;
    watchlisted?: boolean;
    rating?: number | null;
  }) {
    const [upserted] = await db
      .insert(serialInteractions)
      .values({
        userId: input.userId,
        seriesId: input.seriesId,
        liked: input.liked ?? false,
        watchlisted: input.watchlisted ?? false,
        rating: input.rating ?? null,
      })
      .onConflictDoUpdate({
        target: [serialInteractions.userId, serialInteractions.seriesId],
        set: {
          ...(input.liked !== undefined && { liked: input.liked }),
          ...(input.watchlisted !== undefined && {
            watchlisted: input.watchlisted,
          }),
          ...(input.rating !== undefined && {
            rating: input.rating,
          }),
        },
      })
      .returning();

    return upserted ?? null;
  }

  static async insertDiaryEntry(input: {
    userId: string;
    seriesId: number;
    watchedDate: string;
    rating: number | null;
    rewatch: boolean;
  }) {
    const [entry] = await db
      .insert(serialDiaryEntries)
      .values({
        userId: input.userId,
        seriesId: input.seriesId,
        watchedDate: input.watchedDate,
        rating: input.rating,
        rewatch: input.rewatch,
      })
      .returning();

    return entry ?? null;
  }

  static async upsertReview(input: {
    userId: string;
    seriesTmdbId: number;
    diaryEntryId: string;
    content: string;
    containsSpoilers: boolean;
  }) {
    const [review] = await db
      .insert(reviews)
      .values({
        userId: input.userId,
        mediaType: "tv",
        mediaSource: "tmdb",
        mediaSourceId: String(input.seriesTmdbId),
        diaryEntryId: input.diaryEntryId,
        content: input.content,
        containsSpoilers: input.containsSpoilers,
      })
      .onConflictDoUpdate({
        target: [
          reviews.userId,
          reviews.mediaType,
          reviews.mediaSource,
          reviews.mediaSourceId,
        ],
        set: {
          diaryEntryId: input.diaryEntryId,
          content: input.content,
          containsSpoilers: input.containsSpoilers,
          updatedAt: new Date(),
        },
      })
      .returning({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
      });

    return review ?? null;
  }

  static async getLocalArchiveAggregateRowsByTmdbIds(tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    return db
      .select({
        tmdbId: tvSeries.tmdbId,
        firstAirDate: tvSeries.firstAirDate,
        firstAirYear: tvSeries.firstAirYear,
        creator: tvSeries.creator,
        network: tvSeries.network,
        languageCode: tvSeries.languageCode,
        genres: tvSeries.genres,
        logCount: sql<number>`count(${serialDiaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen:
          sql<number | null>`avg(${serialDiaryEntries.rating})::double precision`.as(
            "avgRatingOutOfTen",
          ),
        ratedLogCount:
          sql<number>`count(${serialDiaryEntries.rating})::int`.as("ratedLogCount"),
      })
      .from(tvSeries)
      .leftJoin(serialDiaryEntries, eq(serialDiaryEntries.seriesId, tvSeries.id))
      .where(inArray(tvSeries.tmdbId, uniqueTmdbIds))
      .groupBy(tvSeries.id);
  }

  static async getLocalArchiveRows() {
    return db
      .select({
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        backdropPath: tvSeries.backdropPath,
        firstAirDate: tvSeries.firstAirDate,
        firstAirYear: tvSeries.firstAirYear,
        creator: tvSeries.creator,
        network: tvSeries.network,
        languageCode: tvSeries.languageCode,
        genres: tvSeries.genres,
        logCount: sql<number>`count(${serialDiaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen:
          sql<number | null>`avg(${serialDiaryEntries.rating})::double precision`.as(
            "avgRatingOutOfTen",
          ),
        ratedLogCount:
          sql<number>`count(${serialDiaryEntries.rating})::int`.as("ratedLogCount"),
      })
      .from(tvSeries)
      .leftJoin(serialDiaryEntries, eq(serialDiaryEntries.seriesId, tvSeries.id))
      .groupBy(tvSeries.id)
      .orderBy(asc(tvSeries.title));
  }

  static async getCachedArchiveRows() {
    return SerialsRepository.getLocalArchiveRows();
  }
}
