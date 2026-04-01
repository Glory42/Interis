import { readBoolean, readNumber, readPostMediaType, readString } from "./social-feed-metadata.helper";
import { SocialFeedRepository } from "../repositories/social-feed.repository";
import type {
  FeedMetadata,
  FeedMediaType,
  FeedMovie,
  FeedPost,
  FeedRawMetadata,
  SocialActivity,
} from "../types/social-feed.types";

const toFeedMediaType = (value: string | null): FeedMediaType | null => {
  if (value === "tv") {
    return "tv";
  }

  if (value === "movie") {
    return "movie";
  }

  return null;
};

export const toFeedMetadata = (rawMetadata: FeedRawMetadata): FeedMetadata => {
  const mediaType = toFeedMediaType(readPostMediaType(rawMetadata, "mediaType"));

  return {
    action: readString(rawMetadata, "action"),
    excerpt: readString(rawMetadata, "excerpt"),
    targetUsername: readString(rawMetadata, "targetUsername"),
    rating: readNumber(rawMetadata, "rating"),
    rewatch: readBoolean(rawMetadata, "rewatch"),
    hasReview: readBoolean(rawMetadata, "hasReview"),
    mediaType,
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

  const post = await SocialFeedRepository.getPostById(postId);

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
  const mediaType = toFeedMediaType(readPostMediaType(rawMetadata, "mediaType"));

  if (tmdbId !== null && title) {
    return {
      tmdbId,
      title,
      posterPath: readString(rawMetadata, "posterPath"),
      releaseYear: readNumber(rawMetadata, "releaseYear"),
      mediaType: mediaType ?? "movie",
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

  const movie = await SocialFeedRepository.getMovieById(fallbackMovieId);

  return movie ? { ...movie, mediaType: "movie" } : null;
};
