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

export type FeedMovieLink =
  | { to: "/cinema/$tmdbId"; params: { tmdbId: string } }
  | { to: "/serials/$tmdbId"; params: { tmdbId: string } }
  | { to: "/music/$mbid"; params: { mbid: string } }
  | { to: "/books/$volumeId"; params: { volumeId: string } };

// Resolves the detail-page route/params for a FeedItem's attached media -
// null when the media can't be linked to (e.g. missing id for its type).
export const resolveFeedMovieLink = (
  movie: NonNullable<FeedItem["movie"]>,
): FeedMovieLink | null => {
  if (movie.mediaType === "movie" && movie.tmdbId != null) {
    return { to: "/cinema/$tmdbId", params: { tmdbId: String(movie.tmdbId) } };
  }
  if (movie.mediaType === "tv" && movie.tmdbId != null) {
    return { to: "/serials/$tmdbId", params: { tmdbId: String(movie.tmdbId) } };
  }
  if (movie.mediaType === "album" && movie.mbid) {
    return { to: "/music/$mbid", params: { mbid: movie.mbid } };
  }
  if (movie.mediaType === "book" && movie.volumeId) {
    return { to: "/books/$volumeId", params: { volumeId: movie.volumeId } };
  }
  return null;
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
