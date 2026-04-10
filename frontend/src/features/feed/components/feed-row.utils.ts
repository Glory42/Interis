import type { FeedItem } from "@/features/feed/types";
import { formatRelativeTime } from "@/lib/time";

export type FeedChannel = "cinema" | "serial";

export const inferFeedChannel = (item: FeedItem): FeedChannel | null => {
  if (item.movie?.mediaType === "movie") {
    return "cinema";
  }

  if (item.movie?.mediaType === "tv") {
    return "serial";
  }

  if (item.metadata.mediaType === "movie") {
    return "cinema";
  }

  if (item.metadata.mediaType === "tv") {
    return "serial";
  }

  const attachedMediaType = item.post?.mediaType ?? item.metadata.postMediaType;
  if (attachedMediaType === "movie") {
    return "cinema";
  }

  if (attachedMediaType === "tv") {
    return "serial";
  }

  return null;
};

export const feedChannelMeta: Record<
  FeedChannel,
  {
    label: string;
    color: string;
    tint: string;
  }
> = {
  cinema: {
    label: "CINEMA",
    color: "var(--module-cinema)",
    tint: "rgba(0, 255, 136, 0.08)",
  },
  serial: {
    label: "SERIAL",
    color: "var(--module-serial)",
    tint: "rgba(0, 207, 255, 0.08)",
  },
};

export const getRelativeTime = (value: string): string => {
  return formatRelativeTime(value);
};

export const getRatingOutOfFive = (ratingOutOfTen: number | null): number | null => {
  if (ratingOutOfTen === null || Number.isNaN(ratingOutOfTen)) {
    return null;
  }

  const normalized = Math.max(0, Math.min(10, ratingOutOfTen));
  return normalized / 2;
};

export const getRoundedStars = (ratingOutOfFive: number | null): number => {
  if (ratingOutOfFive === null) {
    return 0;
  }

  return Math.max(0, Math.min(5, Math.round(ratingOutOfFive)));
};
