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
  if (value === "tv") return "tv";
  if (value === "movie") return "movie";
  if (value === "album") return "album";
  if (value === "book") return "book";
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
    mbid: readString(rawMetadata, "mbid"),
    volumeId: readString(rawMetadata, "volumeId"),
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
    (metadata.postMediaType === "movie" ? metadata.postMediaId : null) ??
    (activity.type === "liked_movie" || activity.type === "watchlisted_movie"
      ? Number.parseInt(activity.entityId, 10)
      : null);

  if (!fallbackMovieId || Number.isNaN(fallbackMovieId)) {
    return null;
  }

  return fallbackMovieId;
};

// The album mbid to fetch as a fallback when metadata doesn't already embed
// the album's title - null when no DB lookup is needed.
export const resolveAlbumFallbackMbid = (
  rawMetadata: FeedRawMetadata,
  metadata: FeedMetadata,
): string | null => {
  const title = readString(rawMetadata, "title");
  const mbid = readString(rawMetadata, "mbid") ?? metadata.mbid;

  if (!mbid || title) {
    return null;
  }

  return mbid;
};

// The book volumeId to fetch as a fallback when metadata doesn't already
// embed the book's title - null when no DB lookup is needed.
export const resolveBookFallbackVolumeId = (
  rawMetadata: FeedRawMetadata,
  metadata: FeedMetadata,
): string | null => {
  const title = readString(rawMetadata, "title");
  const volumeId = readString(rawMetadata, "volumeId") ?? metadata.volumeId;

  if (!volumeId || title) {
    return null;
  }

  return volumeId;
};

const resolveAlbum = (
  rawMetadata: FeedRawMetadata,
  metadata: FeedMetadata,
  fallbackMedia: FeedFallbackMediaContext,
): FeedMovie | null => {
  const title = readString(rawMetadata, "title");
  const mbid = readString(rawMetadata, "mbid") ?? metadata.mbid;

  if (mbid && title) {
    return {
      tmdbId: null,
      title,
      posterPath: null,
      coverArtUrl: readString(rawMetadata, "coverArtUrl"),
      releaseYear: readNumber(rawMetadata, "releaseYear"),
      mediaType: "album",
      mbid,
      artistName: readString(rawMetadata, "artistName"),
    };
  }

  if (!mbid) {
    return null;
  }

  const album = fallbackMedia.albumsByMbid.get(mbid);
  if (!album) {
    return null;
  }

  return {
    tmdbId: null,
    title: album.title,
    posterPath: null,
    coverArtUrl: album.coverArtUrl,
    releaseYear: album.releaseYear,
    mediaType: "album",
    mbid: album.mbid,
    artistName: album.artistName,
  };
};

const resolveBook = (
  rawMetadata: FeedRawMetadata,
  metadata: FeedMetadata,
  fallbackMedia: FeedFallbackMediaContext,
): FeedMovie | null => {
  const title = readString(rawMetadata, "title");
  const volumeId = readString(rawMetadata, "volumeId") ?? metadata.volumeId;

  if (volumeId && title) {
    return {
      tmdbId: null,
      title,
      posterPath: null,
      coverArtUrl: readString(rawMetadata, "coverArtUrl"),
      releaseYear: readNumber(rawMetadata, "releaseYear"),
      mediaType: "book",
      volumeId,
      authors: (rawMetadata.authors as string[] | null) ?? null,
    };
  }

  if (!volumeId) {
    return null;
  }

  const book = fallbackMedia.booksByVolumeId.get(volumeId);
  if (!book) {
    return null;
  }

  return {
    tmdbId: null,
    title: book.title,
    posterPath: null,
    coverArtUrl: book.coverArtUrl,
    releaseYear: book.releaseYear,
    mediaType: "book",
    volumeId: book.volumeId,
    authors: book.authors,
  };
};

export const resolveMovie = (
  rawMetadata: FeedRawMetadata,
  activity: SocialActivity,
  metadata: FeedMetadata,
  fallbackMedia: FeedFallbackMediaContext,
): FeedMovie | null => {
  const mediaType = toFeedMediaType(readPostMediaType(rawMetadata, "mediaType"));

  if (mediaType === "album") {
    return resolveAlbum(rawMetadata, metadata, fallbackMedia);
  }

  if (mediaType === "book") {
    return resolveBook(rawMetadata, metadata, fallbackMedia);
  }

  const tmdbId = readNumber(rawMetadata, "tmdbId");
  const title = readString(rawMetadata, "title");

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
