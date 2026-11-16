// HTTP cache lifetimes (seconds) for Film/Series reads; see commons/http/cache-control.helper.ts.
// Anything a viewer's own write can change keeps browser max-age at 0, so their refetch is never stale.
export const MEDIA_CACHE_TIMES = {
  // TMDB trending / now-playing lists.
  tmdbList: { maxAge: 300, sMaxAge: 900 },
  search: { maxAge: 300, sMaxAge: 600 },
  // The cached title row: TMDB data only.
  title: { maxAge: 300, sMaxAge: 3600 },
  // Detail and review pages, matching the in-memory anonymous detail cache.
  detail: { sMaxAge: 60 },
  archive: { sMaxAge: 120 },
  season: { sMaxAge: 300 },
  logs: { sMaxAge: 60 },
} as const;
