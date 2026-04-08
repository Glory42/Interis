import type { MovieArchiveSort } from "@/features/films/api";

export const ARCHIVE_PAGE_SIZE = 30;

export const CINEMA_MODULE_STYLES = {
  accent: "var(--module-cinema)",
  text: "var(--foreground)",
  muted: "color-mix(in srgb, var(--foreground) 68%, transparent)",
  faint: "color-mix(in srgb, var(--foreground) 36%, transparent)",
  border: "color-mix(in srgb, var(--module-cinema) 26%, transparent)",
  borderSoft: "color-mix(in srgb, var(--module-cinema) 16%, transparent)",
  panel: "color-mix(in srgb, var(--card) 92%, var(--background) 8%)",
  panelSoft: "color-mix(in srgb, var(--module-cinema) 10%, transparent)",
  panelStrong: "color-mix(in srgb, var(--module-cinema) 26%, transparent)",
  badge: "color-mix(in srgb, var(--module-cinema) 14%, transparent)",
} as const;

export const sortOptions = [
  { id: "popular", label: "Popular", value: "trending" },
  { id: "rating", label: "Rating", value: "rating_user_desc" },
  { id: "year", label: "Year", value: "release_desc" },
  { id: "az", label: "A -> Z", value: "title_asc" },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  value: MovieArchiveSort;
}>;

export type ArchiveSortTab = (typeof sortOptions)[number]["id"];
