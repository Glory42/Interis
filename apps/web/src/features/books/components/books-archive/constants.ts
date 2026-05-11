import type { BooksArchiveSort } from "@/features/books/api";

export const ARCHIVE_PAGE_SIZE = 30;

export const BOOK_MODULE_STYLES = {
  accent: "var(--module-book)",
  text: "var(--foreground)",
  muted: "color-mix(in srgb, var(--foreground) 68%, transparent)",
  faint: "color-mix(in srgb, var(--foreground) 36%, transparent)",
  border: "color-mix(in srgb, var(--module-book) 26%, transparent)",
  borderSoft: "color-mix(in srgb, var(--module-book) 16%, transparent)",
  panel: "color-mix(in srgb, var(--card) 92%, var(--background) 8%)",
  panelElevated: "color-mix(in srgb, var(--card) 84%, var(--background) 16%)",
  panelSoft: "color-mix(in srgb, var(--module-book) 10%, transparent)",
  panelStrong: "color-mix(in srgb, var(--module-book) 26%, transparent)",
  badge: "color-mix(in srgb, var(--module-book) 14%, transparent)",
} as const;

export const sortOptions: Array<{ value: BooksArchiveSort; label: string }> = [
  { value: "logs_desc", label: "Most read" },
  { value: "published_desc", label: "Newest published" },
  { value: "published_asc", label: "Oldest published" },
  { value: "rating_desc", label: "Highest rated" },
  { value: "title_asc", label: "Title A-Z" },
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
  { value: "ru", label: "Russian" },
  { value: "ar", label: "Arabic" },
  { value: "nl", label: "Dutch" },
] as const;
