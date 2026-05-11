import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { MoviesService } from "../../movies/movies.service";
import { SerialsService } from "../../serials/serials.service";
import { SerialsReviewsRepository } from "../../serials/repositories/serials-reviews.repository";
import { MusicCacheService } from "../../music/services/music-cache.service";
import { BooksCacheService } from "../../books/services/books-cache.service";
import { activities } from "../../social/social.entity";
import { reviewLikes, reviews } from "../reviews.entity";
import { buildReviewCreatedActivityMetadata } from "../helpers/reviews-activity.helper";
import type { CreateReviewDto, UpdateReviewDto } from "../dto/reviews.dto";

export class ReviewsCoreService {
  static async create(userId: string, input: CreateReviewDto) {
    if (input.mediaType === "tv") {
      const tmdbId = Number.parseInt(input.mediaSourceId, 10);
      if (!Number.isFinite(tmdbId)) throw new Error("Invalid tmdbId for tv");
      const series = await SerialsService.findOrCreate(tmdbId);
      if (!series) throw new Error("Series not found");

      const review = await SerialsReviewsRepository.upsertReview({
        userId,
        seriesTmdbId: series.tmdbId,
        diaryEntryId: input.diaryEntryId ?? null,
        content: input.content,
        containsSpoilers: input.containsSpoilers ?? false,
      });

      if (!review) throw new Error("Could not create review");

      await db.insert(activities).values({
        userId,
        type: "review",
        entityId: review.id,
        metadata: JSON.stringify(
          buildReviewCreatedActivityMetadata({
            reviewId: review.id,
            content: input.content,
            containsSpoilers: review.containsSpoilers,
            media: {
              mediaType: "tv",
              tmdbId: series.tmdbId,
              title: series.title,
              posterPath: series.posterPath,
              releaseYear: series.firstAirYear,
            },
          }),
        ),
      });

      return { review, series };
    }

    if (input.mediaType === "album") {
      const album = await MusicCacheService.findOrCreate(input.mediaSourceId);
      if (!album) throw new Error("Album not found");

      const [review] = await db
        .insert(reviews)
        .values({
          userId,
          mediaType: "album",
          mediaSource: "musicbrainz",
          mediaSourceId: album.mbid,
          movieId: null,
          diaryEntryId: input.diaryEntryId ?? null,
          content: input.content,
          containsSpoilers: input.containsSpoilers ?? false,
        })
        .onConflictDoUpdate({
          target: [reviews.userId, reviews.mediaType, reviews.mediaSource, reviews.mediaSourceId],
          set: {
            diaryEntryId: input.diaryEntryId ?? null,
            content: input.content,
            containsSpoilers: input.containsSpoilers ?? false,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!review) throw new Error("Could not create review");

      await db.insert(activities).values({
        userId,
        type: "review",
        entityId: review.id,
        metadata: JSON.stringify(
          buildReviewCreatedActivityMetadata({
            reviewId: review.id,
            content: input.content,
            containsSpoilers: review.containsSpoilers,
            media: {
              mediaType: "album",
              mbid: album.mbid,
              title: album.title,
              coverArtUrl: album.coverArtUrl ?? null,
              artistName: album.artistName,
              releaseYear: album.firstReleaseYear ?? null,
            },
          }),
        ),
      });

      return { review, album };
    }

    if (input.mediaType === "book") {
      const book = await BooksCacheService.findOrCreate(input.mediaSourceId);
      if (!book) throw new Error("Book not found");

      const [review] = await db
        .insert(reviews)
        .values({
          userId,
          mediaType: "book",
          mediaSource: "googlebooks",
          mediaSourceId: book.googleVolumeId,
          movieId: null,
          diaryEntryId: input.diaryEntryId ?? null,
          content: input.content,
          containsSpoilers: input.containsSpoilers ?? false,
        })
        .onConflictDoUpdate({
          target: [reviews.userId, reviews.mediaType, reviews.mediaSource, reviews.mediaSourceId],
          set: {
            diaryEntryId: input.diaryEntryId ?? null,
            content: input.content,
            containsSpoilers: input.containsSpoilers ?? false,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!review) throw new Error("Could not create review");

      await db.insert(activities).values({
        userId,
        type: "review",
        entityId: review.id,
        metadata: JSON.stringify(
          buildReviewCreatedActivityMetadata({
            reviewId: review.id,
            content: input.content,
            containsSpoilers: review.containsSpoilers,
            media: {
              mediaType: "book",
              volumeId: book.googleVolumeId,
              title: book.title,
              coverArtUrl: book.coverImageUrl ?? null,
              authors: (book.authors as string[]) ?? [],
              releaseYear: book.publishedYear ?? null,
            },
          }),
        ),
      });

      return { review, book };
    }

    // movie (default)
    const tmdbId = Number.parseInt(input.mediaSourceId, 10);
    if (!Number.isFinite(tmdbId)) throw new Error("Invalid tmdbId for movie");
    const movie = await MoviesService.findOrCreate(tmdbId);

    const [review] = await db
      .insert(reviews)
      .values({
        userId,
        mediaType: "movie",
        mediaSource: "tmdb",
        mediaSourceId: String(movie.tmdbId),
        movieId: movie.id,
        diaryEntryId: input.diaryEntryId ?? null,
        content: input.content,
        containsSpoilers: input.containsSpoilers ?? false,
      })
      .onConflictDoUpdate({
        target: [
          reviews.userId,
          reviews.mediaType,
          reviews.mediaSource,
          reviews.mediaSourceId,
        ],
        set: {
          movieId: movie.id,
          diaryEntryId: input.diaryEntryId ?? null,
          content: input.content,
          containsSpoilers: input.containsSpoilers ?? false,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!review) {
      throw new Error("Could not create review");
    }

    await db.insert(activities).values({
      userId,
      type: "review",
      entityId: review.id,
      metadata: JSON.stringify(
        buildReviewCreatedActivityMetadata({
          reviewId: review.id,
          content: input.content,
          containsSpoilers: review.containsSpoilers,
          media: {
            mediaType: "movie",
            tmdbId: movie.tmdbId,
            title: movie.title,
            posterPath: movie.posterPath,
            releaseYear: movie.releaseYear,
          },
        }),
      ),
    });

    return { review, movie };
  }

  static async findById(reviewId: string) {
    const [review] = await db
      .select({
        review: reviews,
        likeCount: sql<number>`count(${reviewLikes.reviewId})`.as("like_count"),
      })
      .from(reviews)
      .leftJoin(reviewLikes, eq(reviewLikes.reviewId, reviews.id))
      .where(eq(reviews.id, reviewId))
      .groupBy(reviews.id)
      .limit(1);

    return review ?? null;
  }

  static async findByMovie(movieId: number) {
    return db
      .select()
      .from(reviews)
      .where(and(eq(reviews.movieId, movieId), eq(reviews.mediaType, "movie")))
      .orderBy(desc(reviews.createdAt));
  }

  static async findByUser(userId: string) {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  static async update(reviewId: string, userId: string, input: UpdateReviewDto) {
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

  static async delete(reviewId: string, userId: string) {
    const [deleted] = await db
      .delete(reviews)
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
      .returning({ id: reviews.id });

    return deleted ?? null;
  }
}
