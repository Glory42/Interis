// The taste grid: TMDB's weekly trending (9 Films, 9 Series, already cached
// in-process) plus the titles most watched on Interis.
export const ONBOARDING_STAPLE_FILMS = 12;
export const ONBOARDING_STAPLE_SERIES = 6;
export const ONBOARDING_MAX_TITLES = 36;
export const ONBOARDING_STAPLES_CACHE_TTL_MS = 10 * 60 * 1000;

export const ONBOARDING_TASTE_MAX_ITEMS = ONBOARDING_MAX_TITLES;
// A Series "watched" cascades to every season, so writes run a few at a time.
export const ONBOARDING_TASTE_WRITE_CONCURRENCY = 4;
