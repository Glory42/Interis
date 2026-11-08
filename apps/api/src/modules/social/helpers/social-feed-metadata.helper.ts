import {
  DEFAULT_FEED_PAGE_SIZE,
  MAX_FEED_PAGE_SIZE,
} from "../constants/social-feed.constants";
import { normalizeBoundedLimit } from "../../../commons/helpers/pagination.helper";
import type {
  ActivityType,
  FeedActivityKind,
  FeedMediaType,
  FeedMetadata,
  FeedPostMediaType,
  FeedRawMetadata,
} from "../types/social-feed.types";

export const parseMetadata = (metadata: string | null): FeedRawMetadata => {
  if (!metadata) {
    return {};
  }

  try {
    const parsed = JSON.parse(metadata);
    if (parsed && typeof parsed === "object") {
      return parsed as FeedRawMetadata;
    }
  } catch {
    return {};
  }

  return {};
};

export const readString = (metadata: FeedRawMetadata, key: string): string | null => {
  const value = metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
};

export const readNumber = (metadata: FeedRawMetadata, key: string): number | null => {
  const value = metadata[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

export const readBoolean = (metadata: FeedRawMetadata, key: string): boolean | null => {
  const value = metadata[key];
  return typeof value === "boolean" ? value : null;
};

export const readPostMediaType = (
  metadata: FeedRawMetadata,
  key: string,
): FeedPostMediaType | null => {
  const value = readString(metadata, key);

  if (value === "movie" || value === "tv") {
    return value;
  }

  return null;
};

export const toFeedMediaType = (value: string | null): FeedMediaType | null =>
  value === "tv" || value === "movie" ? value : null;

// The metadata snapshot taken when the activity was recorded; feed kinds
// replace parts of it with live values.
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
    listTitle: null,
    logId: null,
    watchedDate: null,
  };
};

export const resolveActivityKind = (
  activityType: ActivityType,
  action: string | null,
): FeedActivityKind => {
  if (activityType === "commented") {
    if (action === "liked_comment") {
      return "liked_comment";
    }

    if (action === "liked_post") {
      return "liked_post";
    }

    if (action === "commented_post") {
      return "commented_post";
    }
  }

  return activityType;
};

export const normalizeLimit = (limit?: number): number =>
  normalizeBoundedLimit(limit, { default: DEFAULT_FEED_PAGE_SIZE, max: MAX_FEED_PAGE_SIZE });
