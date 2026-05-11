import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { albums } from "../../music/music.entity";
import { books } from "../../books/books.entity";
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
  const post = await SocialFeedRepository.getPostById(postId);

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

export const resolveMovie = async (
  rawMetadata: FeedRawMetadata,
  activity: SocialActivity,
  metadata: FeedMetadata,
): Promise<FeedMovie | null> => {
  const mediaType = toFeedMediaType(readPostMediaType(rawMetadata, "mediaType"));
  const title = readString(rawMetadata, "title");

  // Album
  if (mediaType === "album") {
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
    if (mbid) {
      const [album] = await db
        .select({ title: albums.title, coverArtUrl: albums.coverArtUrl, firstReleaseYear: albums.firstReleaseYear, artistName: albums.artistName })
        .from(albums)
        .where(eq(albums.mbid, mbid))
        .limit(1);
      if (album) {
        return {
          tmdbId: null,
          title: album.title,
          posterPath: null,
          coverArtUrl: album.coverArtUrl ?? null,
          releaseYear: album.firstReleaseYear ?? null,
          mediaType: "album",
          mbid,
          artistName: album.artistName,
        };
      }
    }
    return null;
  }

  // Book
  if (mediaType === "book") {
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
    if (volumeId) {
      const [book] = await db
        .select({ title: books.title, coverImageUrl: books.coverImageUrl, publishedYear: books.publishedYear, authors: books.authors })
        .from(books)
        .where(eq(books.googleVolumeId, volumeId))
        .limit(1);
      if (book) {
        return {
          tmdbId: null,
          title: book.title,
          posterPath: null,
          coverArtUrl: book.coverImageUrl ?? null,
          releaseYear: book.publishedYear ?? null,
          mediaType: "book",
          volumeId,
          authors: (book.authors as string[]) ?? null,
        };
      }
    }
    return null;
  }

  const tmdbId = readNumber(rawMetadata, "tmdbId");
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
