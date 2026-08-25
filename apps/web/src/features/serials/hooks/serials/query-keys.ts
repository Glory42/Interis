import type {
  SerialArchivePeriod,
  SerialArchiveSort,
  SerialDetailReviewSort,
} from "@/features/serials/api";

export const serialKeys = {
  all: ["serials"] as const,
  search: (query: string) => ["serials", "search", query] as const,
  detail: (tmdbId: number) => ["serials", "detail", tmdbId] as const,
  detailView: (tmdbId: number, reviewsSort: SerialDetailReviewSort) =>
    ["serials", "detail-view", tmdbId, reviewsSort] as const,
  // Prefix-only variant (no reviewsSort) - matches every sort variant for a
  // given series, for invalidations/cache lookups that don't care which sort
  // is currently cached.
  detailViewRoot: (tmdbId: number) => ["serials", "detail-view", tmdbId] as const,
  seasonDetail: (tmdbId: number, seasonNumber: number) =>
    ["serials", "season-detail", tmdbId, seasonNumber] as const,
  // Prefix-only variant (no seasonNumber) - matches every cached season for
  // a series, e.g. for a series-level cascade patch/invalidation.
  seasonDetailRoot: (tmdbId: number) => ["serials", "season-detail", tmdbId] as const,
  seasonReview: (tmdbId: number, seasonNumber: number) =>
    ["serials", "season-review", tmdbId, seasonNumber] as const,
  episodeReview: (tmdbId: number, seasonNumber: number, episodeNumber: number) =>
    ["serials", "episode-review", tmdbId, seasonNumber, episodeNumber] as const,
  interaction: (tmdbId: number) => ["serials", "interaction", tmdbId] as const,
  trending: ["serials", "trending"] as const,
  recent: ["serials", "recent"] as const,
  logs: (tmdbId: number) => ["serials", "logs", tmdbId] as const,
  myLogs: ["serials", "my-logs"] as const,
  archive: (
    genre: string,
    language: string,
    sort: SerialArchiveSort,
    period: SerialArchivePeriod,
    limit: number,
  ) => ["serials", "archive", genre, language, sort, period, limit] as const,
};
