import {
  DEFAULT_FEED_PAGE_SIZE,
  MAX_FEED_PAGE_SIZE,
} from "../constants/social-feed.constants";
import type {
  ActivityType,
  FeedActivityKind,
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

  if (value === "movie" || value === "tv" || value === "book" || value === "music") {
    return value;
  }

  return null;
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

export const normalizeLimit = (limit?: number): number => {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_FEED_PAGE_SIZE;
  }

  return Math.max(1, Math.min(limit, MAX_FEED_PAGE_SIZE));
};
