import type { FeedItem } from "@/features/feed/types";
import { formatRelativeTime } from "@/lib/time";

export type FeedChannel = "cinema" | "serial" | "music" | "books";

export const inferFeedChannel = (item: FeedItem): FeedChannel | null => {
  const mediaType = item.movie?.mediaType ?? item.metadata.mediaType;

  if (mediaType === "movie") return "cinema";
  if (mediaType === "tv") return "serial";
  if (mediaType === "album") return "music";
  if (mediaType === "book") return "books";

  const attachedMediaType = item.post?.mediaType ?? item.metadata.postMediaType;
  if (attachedMediaType === "movie") return "cinema";
  if (attachedMediaType === "tv") return "serial";
  if (attachedMediaType === "album") return "music";
  if (attachedMediaType === "book") return "books";

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
  music: {
    label: "MUSIC",
    color: "var(--module-music)",
    tint: "rgba(168, 85, 247, 0.08)",
  },
  books: {
    label: "BOOKS",
    color: "var(--module-book)",
    tint: "rgba(249, 115, 22, 0.08)",
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
