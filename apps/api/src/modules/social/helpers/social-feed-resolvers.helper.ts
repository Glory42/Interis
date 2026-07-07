import { readBoolean, readNumber, readPostMediaType, readString } from "./social-feed-metadata.helper";
import type {
  FeedFallbackMediaContext,
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
    seasonNumber: readNumber(rawMetadata, "seasonNumber"),
    episodeNumber: readNumber(rawMetadata, "episodeNumber"),
    listId: null,
    listTitle: readString(rawMetadata, "title"),
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

// The id of the post to fetch as a fallback when metadata doesn't already
// embed the post's content - null when no DB lookup is needed at all.
export const resolvePostFallbackId = (
  rawMetadata: FeedRawMetadata,
  activity: SocialActivity,
): string | null => {
  const postIdFromMetadata = readString(rawMetadata, "postId");
  if (activity.type !== "post" && !postIdFromMetadata) {
    return null;
  }

  return postIdFromMetadata ?? activity.entityId;
};

export const resolvePost = (
  rawMetadata: FeedRawMetadata,
  activity: SocialActivity,
  fallbackMedia: FeedFallbackMediaContext,
): FeedPost | null => {
  const postId = resolvePostFallbackId(rawMetadata, activity);
  if (!postId) {
    return null;
  }

  const post = fallbackMedia.postsById.get(postId);

  if (post) {
    return {
      id: post.id,
      content: post.content,
      mediaId: post.mediaId,
      mediaType: post.mediaType,
    };
  }

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

  return null;
};

// The internal movie id to fetch as a fallback when metadata doesn't
// already embed the movie's tmdbId+title - null when no DB lookup is
// needed at all (either embedded data suffices, or there's no movie).
export const resolveMovieFallbackId = (
  rawMetadata: FeedRawMetadata,
  activity: SocialActivity,
  metadata: FeedMetadata,
): number | null => {
  const tmdbId = readNumber(rawMetadata, "tmdbId");
  const title = readString(rawMetadata, "title");

  if (tmdbId !== null && title) {
    return null;
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

  return fallbackMovieId;
};

export const resolveMovie = (
  rawMetadata: FeedRawMetadata,
  activity: SocialActivity,
  metadata: FeedMetadata,
  fallbackMedia: FeedFallbackMediaContext,
): FeedMovie | null => {
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

  const fallbackMovieId = resolveMovieFallbackId(rawMetadata, activity, metadata);
  if (fallbackMovieId === null) {
    return null;
  }

  const movie = fallbackMedia.moviesById.get(fallbackMovieId);

  return movie
    ? {
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterPath: movie.posterPath,
        releaseYear: movie.releaseYear,
        mediaType: "movie",
      }
    : null;
};
