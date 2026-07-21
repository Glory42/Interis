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

// "S1E4" for an episode-scoped activity, "Season 1" for a season-scoped
// one, or null for a plain series/movie-level activity.
export const toSeasonEpisodeLabel = (item: FeedItem): string | null => {
  const { seasonNumber, episodeNumber } = item.metadata;
  if (episodeNumber != null && seasonNumber != null) {
    return `S${seasonNumber}E${episodeNumber}`;
  }
  if (seasonNumber != null) {
    return `Season ${seasonNumber}`;
  }
  return null;
};

// Used for quoted "replying to" snippets (the original review/post text),
// which are shown truncated rather than in full.
export const truncateQuote = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
