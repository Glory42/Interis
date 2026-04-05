import type { FeedItem } from "@/features/feed/types";

export type FeedChannel = "cinema" | "serial" | "codex" | "echoes";

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
  if (attachedMediaType === "book") {
    return "codex";
  }

  if (attachedMediaType === "music") {
    return "echoes";
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
  codex: {
    label: "CODEX",
    color: "var(--module-codex)",
    tint: "rgba(255, 170, 0, 0.08)",
  },
  echoes: {
    label: "ECHOES",
    color: "var(--module-echoes)",
    tint: "rgba(255, 68, 255, 0.08)",
  },
};

export const getRelativeTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const deltaSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(deltaSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 60) {
    return formatter.format(deltaSeconds, "second");
  }

  const deltaMinutes = Math.round(deltaSeconds / 60);
  if (Math.abs(deltaMinutes) < 60) {
    return formatter.format(deltaMinutes, "minute");
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 24) {
    return formatter.format(deltaHours, "hour");
  }

  const deltaDays = Math.round(deltaHours / 24);
  return formatter.format(deltaDays, "day");
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
