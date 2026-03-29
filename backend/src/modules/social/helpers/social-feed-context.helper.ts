import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { comments, reviewLikes, reviews } from "../../reviews/reviews.entity";
import { diaryEntries } from "../../diary/diary.entity";
import { movies } from "../../movies/movies.entity";
import { postComments, postLikes } from "../../posts/posts.entity";
import { parseMetadata, readString } from "./social-feed-metadata.helper";
import { resolveReviewId, toFeedMetadata } from "./social-feed-resolvers.helper";
import type {
  ActivityRow,
  PostEngagement,
  ReviewContext,
  ReviewFeedContext,
} from "../types/social-feed.types";

export const buildReviewContext = async (
  rows: ActivityRow[],
  viewerId?: string,
): Promise<ReviewContext> => {
  const reviewIds = new Set<string>();
  const diaryEntryIds = new Set<string>();

  for (const row of rows) {
    const metadata = toFeedMetadata(parseMetadata(row.activity.metadata));
    const reviewId = resolveReviewId(row.activity, metadata);

    if (reviewId) {
      reviewIds.add(reviewId);
    }

    if (row.activity.type === "diary_entry") {
      diaryEntryIds.add(row.activity.entityId);
    }
  }

  if (reviewIds.size === 0 && diaryEntryIds.size === 0) {
    return {
      byReviewId: new Map(),
      byDiaryEntryId: new Map(),
    };
  }

  const reviewIdList = [...reviewIds];
  const diaryEntryIdList = [...diaryEntryIds];
  const whereClause =
    reviewIdList.length > 0 && diaryEntryIdList.length > 0
      ? or(inArray(reviews.id, reviewIdList), inArray(reviews.diaryEntryId, diaryEntryIdList))
      : reviewIdList.length > 0
        ? inArray(reviews.id, reviewIdList)
        : inArray(reviews.diaryEntryId, diaryEntryIdList);

  const reviewRows = await db
    .select({
      id: reviews.id,
      diaryEntryId: reviews.diaryEntryId,
      content: reviews.content,
      containsSpoilers: reviews.containsSpoilers,
      rating: diaryEntries.rating,
      tmdbId: movies.tmdbId,
      title: movies.title,
      posterPath: movies.posterPath,
      releaseYear: movies.releaseYear,
    })
    .from(reviews)
    .innerJoin(movies, eq(reviews.movieId, movies.id))
    .leftJoin(diaryEntries, eq(reviews.diaryEntryId, diaryEntries.id))
    .where(whereClause);

  const hydratedReviewIds = reviewRows.map((row) => row.id);
  if (hydratedReviewIds.length === 0) {
    return {
      byReviewId: new Map(),
      byDiaryEntryId: new Map(),
    };
  }

  const [reviewLikeRows, commentRows, viewerLikeRows] = await Promise.all([
    db
      .select({
        reviewId: reviewLikes.reviewId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(reviewLikes)
      .where(inArray(reviewLikes.reviewId, hydratedReviewIds))
      .groupBy(reviewLikes.reviewId),
    db
      .select({
        reviewId: comments.reviewId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(comments)
      .where(inArray(comments.reviewId, hydratedReviewIds))
      .groupBy(comments.reviewId),
    viewerId
      ? db
          .select({ reviewId: reviewLikes.reviewId })
          .from(reviewLikes)
          .where(
            and(
              eq(reviewLikes.userId, viewerId),
              inArray(reviewLikes.reviewId, hydratedReviewIds),
            ),
          )
      : Promise.resolve([]),
  ]);

  const likeCountsByReviewId = new Map(reviewLikeRows.map((row) => [row.reviewId, row.count]));
  const commentCountsByReviewId = new Map(commentRows.map((row) => [row.reviewId, row.count]));
  const viewerLikedReviewIds = new Set(viewerLikeRows.map((row) => row.reviewId));

  const byReviewId = new Map<string, ReviewFeedContext>();
  const byDiaryEntryId = new Map<string, ReviewFeedContext>();

  for (const row of reviewRows) {
    const context: ReviewFeedContext = {
      id: row.id,
      diaryEntryId: row.diaryEntryId,
      content: row.content,
      containsSpoilers: row.containsSpoilers,
      rating: row.rating,
      movie: {
        tmdbId: row.tmdbId,
        title: row.title,
        posterPath: row.posterPath,
        releaseYear: row.releaseYear,
      },
      likeCount: likeCountsByReviewId.get(row.id) ?? 0,
      commentCount: commentCountsByReviewId.get(row.id) ?? 0,
      viewerHasLiked: viewerId ? viewerLikedReviewIds.has(row.id) : null,
    };

    byReviewId.set(row.id, context);

    if (row.diaryEntryId) {
      byDiaryEntryId.set(row.diaryEntryId, context);
    }
  }

  return {
    byReviewId,
    byDiaryEntryId,
  };
};

export const buildPostEngagementContext = async (
  rows: ActivityRow[],
): Promise<Map<string, PostEngagement>> => {
  const postIds = new Set<string>();

  for (const row of rows) {
    const metadata = parseMetadata(row.activity.metadata);
    const postIdFromMetadata = readString(metadata, "postId");

    if (row.activity.type !== "post" && !postIdFromMetadata) {
      continue;
    }

    const postId = postIdFromMetadata ?? row.activity.entityId;
    postIds.add(postId);
  }

  if (postIds.size === 0) {
    return new Map();
  }

  const uniquePostIds = [...postIds];
  const [postLikeRows, postCommentRows] = await Promise.all([
    db
      .select({
        postId: postLikes.postId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(postLikes)
      .where(inArray(postLikes.postId, uniquePostIds))
      .groupBy(postLikes.postId),
    db
      .select({
        postId: postComments.postId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(postComments)
      .where(inArray(postComments.postId, uniquePostIds))
      .groupBy(postComments.postId),
  ]);

  const likeCountsByPostId = new Map(postLikeRows.map((row) => [row.postId, row.count]));
  const commentCountsByPostId = new Map(postCommentRows.map((row) => [row.postId, row.count]));

  return new Map(
    uniquePostIds.map((postId) => [
      postId,
      {
        likeCount: likeCountsByPostId.get(postId) ?? 0,
        commentCount: commentCountsByPostId.get(postId) ?? 0,
      },
    ]),
  );
};
