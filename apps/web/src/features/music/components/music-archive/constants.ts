import type { MusicArchiveSort } from "@/features/music/api";

export const ARCHIVE_PAGE_SIZE = 30;

export const MUSIC_MODULE_STYLES = {
  accent: "var(--module-music)",
  text: "var(--foreground)",
  muted: "color-mix(in srgb, var(--foreground) 68%, transparent)",
  faint: "color-mix(in srgb, var(--foreground) 36%, transparent)",
  border: "color-mix(in srgb, var(--module-music) 26%, transparent)",
  borderSoft: "color-mix(in srgb, var(--module-music) 16%, transparent)",
  panel: "color-mix(in srgb, var(--card) 92%, var(--background) 8%)",
  panelElevated: "color-mix(in srgb, var(--card) 84%, var(--background) 16%)",
  panelSoft: "color-mix(in srgb, var(--module-music) 10%, transparent)",
  panelStrong: "color-mix(in srgb, var(--module-music) 26%, transparent)",
  badge: "color-mix(in srgb, var(--module-music) 14%, transparent)",
} as const;

export const sortOptions: Array<{ value: MusicArchiveSort; label: string }> = [
  { value: "popular_lastfm", label: "Popular (Last.fm)" },
  { value: "logs_desc", label: "Most listened" },
  { value: "release_desc", label: "Newest release" },
  { value: "release_asc", label: "Oldest release" },
  { value: "rating_desc", label: "Highest rated" },
  { value: "title_asc", label: "Title A-Z" },
];

export const typeOptions = [
  { value: "all", label: "All types" },
  { value: "Album", label: "Albums" },
  { value: "Single", label: "Singles" },
  { value: "EP", label: "EPs" },
  { value: "Broadcast", label: "Broadcasts" },
  { value: "Other", label: "Other" },
];
