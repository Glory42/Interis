import type { MovieArchivePeriod, MovieArchiveSort } from "@/features/films/api";

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
  { value: "trending", label: "Trending" },
  { value: "rating_user_desc", label: "Highest rated (Users)" },
  { value: "release_desc", label: "Newest release" },
  { value: "title_asc", label: "Title A-Z" },
] as const satisfies ReadonlyArray<{
  value: MovieArchiveSort;
  label: string;
}>;

export const periodOptions: Array<{ value: MovieArchivePeriod; label: string }> = [
  { value: "all_time", label: "All time" },
  { value: "this_year", label: "This year" },
  { value: "last_10_years", label: "Last 10 years" },
  { value: "this_week", label: "This week" },
  { value: "today", label: "Today" },
];

export const languageOptions = [
  { value: "all", label: "All languages" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "hi", label: "Hindi" },
  { value: "tr", label: "Turkish" },
  { value: "ru", label: "Russian" },
  { value: "ar", label: "Arabic" },
  { value: "sv", label: "Swedish" },
  { value: "da", label: "Danish" },
  { value: "no", label: "Norwegian" },
  { value: "fi", label: "Finnish" },
  { value: "nl", label: "Dutch" },
] as const;
