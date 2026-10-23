import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { movies } from "../../movies/movies.entity";
import { serialDiaryEntries, tvSeries } from "../../serials/serials.entity";
import { diaryEntries } from "../../diary/diary.entity";
import { reviewLikes, reviews } from "../reviews.entity";
import type { UpdateReviewDto } from "../dto/reviews.dto";
import type { MediaType } from "../../media/constants/media-type.constant";
import type { ReviewRowMediaType } from "../constants/review-media-type.constant";

export class ReviewsRepository {
  static async getLikeCounts(reviewIds: string[]) {
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

  static async getViewerLikedReviewIds(viewerUserId: string, reviewIds: string[]) {
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

  static async getExistingLike(userId: string, reviewId: string) {
    const [existing] = await db
      .select()
      .from(reviewLikes)
      .where(and(eq(reviewLikes.userId, userId), eq(reviewLikes.reviewId, reviewId)))
      .limit(1);

    return existing ?? null;
  }

  static async insertLike(userId: string, reviewId: string) {
    await db.insert(reviewLikes).values({ userId, reviewId });
  }

  static async deleteLike(userId: string, reviewId: string) {
    const [deleted] = await db
      .delete(reviewLikes)
      .where(and(eq(reviewLikes.userId, userId), eq(reviewLikes.reviewId, reviewId)))
      .returning({ reviewId: reviewLikes.reviewId });

    return deleted ?? null;
  }

  // The single low-level insert into the review table. A user can review
  // the same title more than once (#72), so this always adds a row:
  // standalone movie/tv reviews (createReview below), diary-linked reviews
  // (DiaryWriteService, DataImportService) and season/episode reviews
  // (SerialsSeasonEpisodeReviewsRepository) all go through here.
  // `mediaSourceId` is pre-composed by the caller (a bare tmdbId for
  // movie/tv, a `tmdb:season[:episode]` key for the nested serial levels).
  static async insertReviewRow(input: {
    userId: string;
    mediaType: ReviewRowMediaType;
    mediaSource?: string;
    mediaSourceId: string;
    movieId?: number | null;
    diaryEntryId?: string | null;
    content: string;
    containsSpoilers: boolean;
  }) {
    const [row] = await db
      .insert(reviews)
      .values({
        userId: input.userId,
        mediaType: input.mediaType,
        mediaSource: input.mediaSource ?? "tmdb",
        mediaSourceId: input.mediaSourceId,
        movieId: input.movieId ?? null,
        diaryEntryId: input.diaryEntryId ?? null,
        content: input.content,
        containsSpoilers: input.containsSpoilers,
      })
      .returning();

    return row ?? null;
  }

  // Standalone / diary-linked movie and TV reviews, keyed by a bare TMDB
  // id. movieId is null for TV reviews, which have no row in the movies
  // table.
  static async createReview(input: {
    userId: string;
    mediaType: MediaType;
    tmdbId: number;
    movieId: number | null;
    diaryEntryId: string | null;
    content: string;
    containsSpoilers: boolean;
  }) {
    return ReviewsRepository.insertReviewRow({
      userId: input.userId,
      mediaType: input.mediaType,
      mediaSourceId: String(input.tmdbId),
      movieId: input.movieId,
      diaryEntryId: input.diaryEntryId,
      content: input.content,
      containsSpoilers: input.containsSpoilers,
    });
  }

  static async existsForDiaryEntry(diaryEntryId: string) {
    const [row] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.diaryEntryId, diaryEntryId))
      .limit(1);
    return Boolean(row);
  }

  // One user's reviews of one title, newest first, each with the rating and
  // watch date of the log it belongs to (season/episode reviews have no log).
  static async findByUserAndMediaSource(
    userId: string,
    mediaType: ReviewRowMediaType,
    mediaSourceId: string,
    limit: number,
  ) {
    return db
      .select({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        diaryEntryId: reviews.diaryEntryId,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        rating: sql<number | null>`coalesce(${diaryEntries.rating}, ${serialDiaryEntries.rating})`,
        watchedDate: sql<
          string | null
        >`coalesce(${diaryEntries.watchedDate}, ${serialDiaryEntries.watchedDate})::text`,
      })
      .from(reviews)
      .leftJoin(
        diaryEntries,
        and(eq(reviews.mediaType, "movie"), eq(diaryEntries.id, reviews.diaryEntryId)),
      )
      .leftJoin(
        serialDiaryEntries,
        and(eq(reviews.mediaType, "tv"), eq(serialDiaryEntries.id, reviews.diaryEntryId)),
      )
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.mediaType, mediaType),
          eq(reviews.mediaSource, "tmdb"),
          eq(reviews.mediaSourceId, mediaSourceId),
        ),
      )
      .orderBy(desc(reviews.createdAt), desc(reviews.id))
      .limit(limit);
  }

  static async findByIdWithLikeCount(reviewId: string) {
    const [review] = await db
      .select({
        review: reviews,
        likeCount: sql<number>`count(${reviewLikes.reviewId})::int`.as("like_count"),
      })
      .from(reviews)
      .leftJoin(reviewLikes, eq(reviewLikes.reviewId, reviews.id))
      .where(eq(reviews.id, reviewId))
      .groupBy(reviews.id)
      .limit(1);

    return review ?? null;
  }

  static async findByMovieId(movieId: number) {
    return db
      .select()
      .from(reviews)
      .where(and(eq(reviews.movieId, movieId), eq(reviews.mediaType, "movie")))
      .orderBy(desc(reviews.createdAt));
  }

  static async findByUserId(userId: string) {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  static async updateByIdAndUser(reviewId: string, userId: string, input: UpdateReviewDto) {
    const [updated] = await db
      .update(reviews)
      .set({
        ...(input.content !== undefined && { content: input.content }),
        ...(input.containsSpoilers !== undefined && {
          containsSpoilers: input.containsSpoilers,
        }),
      })
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
      .returning();

    return updated ?? null;
  }

  static async deleteByIdAndUser(reviewId: string, userId: string) {
    const [deleted] = await db
      .delete(reviews)
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
      .returning({ id: reviews.id, userId: reviews.userId });

    return deleted ?? null;
  }

  // No ownership check — admin moderation only.
  static async deleteById(reviewId: string) {
    const [deleted] = await db
      .delete(reviews)
      .where(eq(reviews.id, reviewId))
      .returning({ id: reviews.id, userId: reviews.userId });

    return deleted ?? null;
  }

  // Movie reviews only — TV reviews live in the serials module's own table.
  static async listAllForAdmin(
    filters: { userId?: string; movieId?: number },
    limit: number,
    offset: number,
  ) {
    const conditions = [];
    if (filters.userId) conditions.push(eq(reviews.userId, filters.userId));
    if (filters.movieId) conditions.push(eq(reviews.movieId, filters.movieId));

    return db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        authorUsername: user.username,
        mediaType: reviews.mediaType,
        movieId: reviews.movieId,
        movieTitle: movies.title,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .leftJoin(movies, eq(movies.id, reviews.movieId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);
  }

  static async getReviewWithMedia(reviewId: string) {
    const [reviewRow] = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        reviewAuthorUsername: user.username,
        mediaType: reviews.mediaType,
        mediaSource: reviews.mediaSource,
        mediaSourceId: reviews.mediaSourceId,
        movieId: reviews.movieId,
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!reviewRow) {
      return null;
    }

    if (reviewRow.mediaType === "movie" && reviewRow.movieId !== null) {
      const [movieRow] = await db
        .select({
          tmdbId: movies.tmdbId,
          title: movies.title,
          posterPath: movies.posterPath,
          releaseYear: movies.releaseYear,
        })
        .from(movies)
        .where(eq(movies.id, reviewRow.movieId))
        .limit(1);

      return {
        ...reviewRow,
        tmdbId: movieRow?.tmdbId ?? Number(reviewRow.mediaSourceId),
        title: movieRow?.title ?? null,
        posterPath: movieRow?.posterPath ?? null,
        releaseYear: movieRow?.releaseYear ?? null,
      };
    }

    if (reviewRow.mediaType === "tv") {
      const tmdbId = Number(reviewRow.mediaSourceId);
      const [seriesRow] = Number.isNaN(tmdbId)
        ? [null]
        : await db
            .select({
              tmdbId: tvSeries.tmdbId,
              title: tvSeries.title,
              posterPath: tvSeries.posterPath,
              releaseYear: tvSeries.firstAirYear,
            })
            .from(tvSeries)
            .where(eq(tvSeries.tmdbId, tmdbId))
            .limit(1);

      return {
        ...reviewRow,
        tmdbId: seriesRow?.tmdbId ?? (Number.isNaN(tmdbId) ? null : tmdbId),
        title: seriesRow?.title ?? null,
        posterPath: seriesRow?.posterPath ?? null,
        releaseYear: seriesRow?.releaseYear ?? null,
      };
    }

    return {
      ...reviewRow,
      tmdbId: null,
      title: null,
      posterPath: null,
      releaseYear: null,
    };
  }
}
