export const CONTRIBUTION_MEDIA_TYPES = ["film", "tv", "book", "music"] as const;

export const CONTRIBUTION_MEDIA_MASK_BITS = {
  film: 1,
  tv: 2,
  book: 4,
  music: 8,
} as const;

export const MIN_CONTRIBUTION_WINDOW_DAYS = 1;
export const MAX_CONTRIBUTION_WINDOW_DAYS = 730;

export const DEFAULT_PUBLIC_RECENT_LIMIT = 10;
export const MAX_PUBLIC_RECENT_LIMIT = 20;

export const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const contributionActivityTypes = ["diary_entry", "review"] as const;
