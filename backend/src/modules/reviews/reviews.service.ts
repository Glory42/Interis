import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { reviewLikes, reviews, commentLikes, comments } from "./reviews.entity";
import { activities } from "../social/social.entity";
import { MoviesService } from "../movies/movies.service";
import { movies } from "../movies/movies.entity";
import { user } from "../../infrastructure/database/auth.entity";
import { profiles } from "../users/users.entity";
import type { CreateReviewDto, UpdateReviewDto } from "./dto/reviews.dto";

export class ReviewsService {
  private static async getMovieMetadataForReview(reviewId: string) {
    const [row] = await db
      .select({
        movieId: reviews.movieId,
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
      })
      .from(reviews)
      .innerJoin(movies, eq(reviews.movieId, movies.id))
      .where(eq(reviews.id, reviewId))
      .limit(1);

    return row ?? null;
  }

  private static async getMovieMetadataForComment(commentId: string) {
    const [row] = await db
      .select({
        reviewId: comments.reviewId,
        movieId: reviews.movieId,
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
      })
      .from(comments)
      .innerJoin(reviews, eq(comments.reviewId, reviews.id))
      .innerJoin(movies, eq(reviews.movieId, movies.id))
      .where(eq(comments.id, commentId))
      .limit(1);

    return row ?? null;
  }

  static async create(userId: string, input: CreateReviewDto) {
    const movie = await MoviesService.findOrCreate(input.tmdbId);

    const [review] = await db
      .insert(reviews)
      .values({
        userId,
        movieId: movie.id,
        diaryEntryId: input.diaryEntryId ?? null,
        content: input.content,
        containsSpoilers: input.containsSpoilers ?? false,
      })
      .returning();

    if (!review) {
      throw new Error("Could not create review");
    }

    await db.insert(activities).values({
      userId,
      type: "review",
      entityId: review.id,
      metadata: JSON.stringify({
        reviewId: review.id,
        movieId: movie.id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterPath: movie.posterPath,
        releaseYear: movie.releaseYear,
        containsSpoilers: review.containsSpoilers,
        excerpt: input.content.slice(0, 120),
      }),
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
      .where(eq(reviews.movieId, movieId))
      .orderBy(desc(reviews.createdAt));
  }

  static async findByUser(userId: string) {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  static async update(
    reviewId: string,
    userId: string,
    input: UpdateReviewDto,
  ) {
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

  static async getComments(reviewId: string) {
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

  static async addComment(userId: string, reviewId: string, content: string) {
    const [review] = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        movieId: reviews.movieId,
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
      })
      .from(reviews)
      .innerJoin(movies, eq(reviews.movieId, movies.id))
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!review) return null;

    const [comment] = await db
      .insert(comments)
      .values({ userId, reviewId, content })
      .returning();

    if (!comment) {
      throw new Error("Could not create comment");
    }

    await db.insert(activities).values({
      userId,
      type: "commented",
      entityId: comment.id,
      metadata: JSON.stringify({
        action: "commented",
        reviewId,
        commentId: comment.id,
        excerpt: content.slice(0, 120),
        movieId: review.movieId,
        tmdbId: review.tmdbId,
        title: review.title,
        posterPath: review.posterPath,
        releaseYear: review.releaseYear,
      }),
    });

    const [commentWithAuthor] = await db
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
      .where(eq(comments.id, comment.id))
      .limit(1);

    if (!commentWithAuthor) {
      throw new Error("Could not load comment author details");
    }

    return commentWithAuthor;
  }

  static async deleteComment(commentId: string, userId: string) {
    const [deleted] = await db
      .delete(comments)
      .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
      .returning({ id: comments.id });

    return deleted ?? null;
  }

  static async likeReview(userId: string, reviewId: string) {
    const [existing] = await db
      .select()
      .from(reviewLikes)
      .where(
        and(eq(reviewLikes.userId, userId), eq(reviewLikes.reviewId, reviewId)),
      )
      .limit(1);

    if (existing) return { liked: true, alreadyLiked: true };

    await db.insert(reviewLikes).values({ userId, reviewId });

    const movieMetadata = await ReviewsService.getMovieMetadataForReview(reviewId);

    await db.insert(activities).values({
      userId,
      type: "liked_review",
      entityId: reviewId,
      metadata: JSON.stringify({
        action: "liked_review",
        reviewId,
        movieId: movieMetadata?.movieId ?? null,
        tmdbId: movieMetadata?.tmdbId ?? null,
        title: movieMetadata?.title ?? null,
        posterPath: movieMetadata?.posterPath ?? null,
        releaseYear: movieMetadata?.releaseYear ?? null,
      }),
    });

    return { liked: true, alreadyLiked: false };
  }

  static async unlikeReview(userId: string, reviewId: string) {
    const [deleted] = await db
      .delete(reviewLikes)
      .where(
        and(eq(reviewLikes.userId, userId), eq(reviewLikes.reviewId, reviewId)),
      )
      .returning({ reviewId: reviewLikes.reviewId });

    return deleted ?? null;
  }

  static async likeComment(userId: string, commentId: string) {
    const [existing] = await db
      .select()
      .from(commentLikes)
      .where(
        and(
          eq(commentLikes.userId, userId),
          eq(commentLikes.commentId, commentId),
        ),
      )
      .limit(1);

    if (existing) return { liked: true, alreadyLiked: true };

    await db.insert(commentLikes).values({ userId, commentId });

    const movieMetadata = await ReviewsService.getMovieMetadataForComment(commentId);

    await db.insert(activities).values({
      userId,
      type: "commented",
      entityId: commentId,
      metadata: JSON.stringify({
        action: "liked_comment",
        commentId,
        reviewId: movieMetadata?.reviewId ?? null,
        movieId: movieMetadata?.movieId ?? null,
        tmdbId: movieMetadata?.tmdbId ?? null,
        title: movieMetadata?.title ?? null,
        posterPath: movieMetadata?.posterPath ?? null,
        releaseYear: movieMetadata?.releaseYear ?? null,
      }),
    });

    return { liked: true, alreadyLiked: false };
  }

  static async unlikeComment(userId: string, commentId: string) {
    const [deleted] = await db
      .delete(commentLikes)
      .where(
        and(
          eq(commentLikes.userId, userId),
          eq(commentLikes.commentId, commentId),
        ),
      )
      .returning({ commentId: commentLikes.commentId });

    return deleted ?? null;
  }
}
