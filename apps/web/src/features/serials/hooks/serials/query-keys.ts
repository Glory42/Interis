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
  seasonDetail: (tmdbId: number, seasonNumber: number) =>
    ["serials", "season-detail", tmdbId, seasonNumber] as const,
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
