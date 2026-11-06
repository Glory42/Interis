import type { UserMediaShelfType } from "@/features/profile/api";

export type MediaShelfFilter = "all" | "movie" | "serial";
export type MediaShelfCounts = { movie: number; tv: number };

export const mediaShelfFilters: Array<{ key: MediaShelfFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "movie", label: "Movie" },
  { key: "serial", label: "Serial" },
];

export const toMediaShelfType = (filter: MediaShelfFilter): UserMediaShelfType =>
  filter === "serial" ? "tv" : filter;

export const mediaShelfCount = (filter: MediaShelfFilter, counts: MediaShelfCounts): number => {
  if (filter === "movie") return counts.movie;
  if (filter === "serial") return counts.tv;
  return counts.movie + counts.tv;
};
