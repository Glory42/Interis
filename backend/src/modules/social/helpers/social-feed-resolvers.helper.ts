import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { movies } from "../../movies/movies.entity";
import { posts } from "../../posts/posts.entity";
import { readBoolean, readNumber, readPostMediaType, readString } from "./social-feed-metadata.helper";
import type {
  FeedMetadata,
  FeedMovie,
  FeedPost,
  FeedRawMetadata,
  SocialActivity,
} from "../types/social-feed.types";

export const toFeedMetadata = (rawMetadata: FeedRawMetadata): FeedMetadata => {
  return {
    action: readString(rawMetadata, "action"),
    excerpt: readString(rawMetadata, "excerpt"),
    targetUsername: readString(rawMetadata, "targetUsername"),
    rating: readNumber(rawMetadata, "rating"),
    rewatch: readBoolean(rawMetadata, "rewatch"),
    containsSpoilers: readBoolean(rawMetadata, "containsSpoilers"),
    reviewId: readString(rawMetadata, "reviewId"),
    commentId: readString(rawMetadata, "commentId"),
    movieId: readNumber(rawMetadata, "movieId"),
    postId: readString(rawMetadata, "postId"),
    postMediaId: readNumber(rawMetadata, "mediaId"),
    postMediaType: readPostMediaType(rawMetadata, "mediaType"),
  };
};

export const resolveReviewId = (
  activity: SocialActivity,
  metadata: FeedMetadata,
): string | null => {
  if (activity.type === "review" || activity.type === "liked_review") {
    return metadata.reviewId ?? activity.entityId;
  }

  return metadata.reviewId;
};

export const resolvePost = async (
  rawMetadata: FeedRawMetadata,
  activity: SocialActivity,
): Promise<FeedPost | null> => {
  const postIdFromMetadata = readString(rawMetadata, "postId");
  if (activity.type !== "post" && !postIdFromMetadata) {
    return null;
  }

  const postId = postIdFromMetadata ?? activity.entityId;
  const contentFromMetadata =
    readString(rawMetadata, "content") ?? readString(rawMetadata, "excerpt");
  const mediaIdFromMetadata = readNumber(rawMetadata, "mediaId");
  const mediaTypeFromMetadata = readPostMediaType(rawMetadata, "mediaType");

  if (contentFromMetadata) {
    return {
      id: postId,
      content: contentFromMetadata,
      mediaId: mediaIdFromMetadata,
      mediaType: mediaTypeFromMetadata,
    };
  }

  const [post] = await db
    .select({
      id: posts.id,
      content: posts.content,
      mediaId: posts.mediaId,
      mediaType: posts.mediaType,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!post) {
    return null;
  }

  return {
    id: post.id,
    content: post.content,
    mediaId: post.mediaId,
    mediaType: post.mediaType,
  };
};

export const resolveMovie = async (
  rawMetadata: FeedRawMetadata,
  activity: SocialActivity,
  metadata: FeedMetadata,
): Promise<FeedMovie | null> => {
  const tmdbId = readNumber(rawMetadata, "tmdbId");
  const title = readString(rawMetadata, "title");

  if (tmdbId !== null && title) {
    return {
      tmdbId,
      title,
      posterPath: readString(rawMetadata, "posterPath"),
      releaseYear: readNumber(rawMetadata, "releaseYear"),
    };
  }

  const fallbackMovieId =
    metadata.movieId ??
    (metadata.postMediaType === "movie"
      ? metadata.postMediaId
      : null) ??
    (activity.type === "liked_movie" || activity.type === "watchlisted_movie"
      ? Number.parseInt(activity.entityId, 10)
      : null);

  if (!fallbackMovieId || Number.isNaN(fallbackMovieId)) {
    return null;
  }

  const [movie] = await db
    .select({
      tmdbId: movies.tmdbId,
      title: movies.title,
      posterPath: movies.posterPath,
      releaseYear: movies.releaseYear,
    })
    .from(movies)
    .where(eq(movies.id, fallbackMovieId))
    .limit(1);

  return movie ?? null;
};
