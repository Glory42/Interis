# Trending/popularity data is TTL-cached with lazy refresh, not live-fetched like TMDB

**Status:** accepted

Cinema/Serials' "Trending" archive sort calls TMDB live on every request (`getTrendingMoviesPage`/`discoverMovies` are not cached at all — only per-id detail/credits/similar lookups go through the in-memory TTL cache in `tmdb-cache.helper.ts`). Our own DB only overlays community rating/log counts onto whichever titles are in that live response. There is no scheduled/background-job infrastructure anywhere in this backend today.

Music and books need an equivalent trending signal, sourced from Last.fm (album/track popularity) and the NYT Books API (bestseller lists) respectively, layered onto MusicBrainz/Google Books as the metadata backbone.

**Decision:** do not copy the TMDB live-fetch precedent for these new sources. Trending/popularity fields are cached in our DB with their own `fetchedAt` timestamp (separate from the existing `cachedAt` used for permanent metadata), refreshed lazily when stale rather than on a fixed schedule — same non-blocking TTL philosophy as `tmdb-cache.helper.ts`, applied at the DB row level instead of in-memory. Static metadata (title, tracklist, genres) keeps the existing cache-once-forever behavior unchanged.

**Considered Options:**
- **Copy TMDB's live-fetch pattern exactly** — rejected specifically for capacity reasons, not style: NYT's API is capped at 1,000 requests/day, and a single popular archive-page day would exhaust it if hit live on every trending-sorted request. Last.fm's limits are more generous but informal/unpublished; treating music and books inconsistently for no real reason wasn't worth it.
- **Real scheduled jobs (a cron worker refreshing the whole catalog on a cadence)** — more "correct" long-term, but this app has zero job infrastructure today; deferred until the lazy-TTL approach proves insufficient.

**Consequences:** a field's provenance (`coverArtSource`, `externalRatingSource`) is tracked only where there's a real fallback chain to remember (cover art, external rating) — not for MusicBrainz/Google-Books-sourced metadata, which has no fallback chain. The merge logic itself (which source wins per field, in what order) is written concretely inside `MusicCacheService`/`BooksCacheService` per media type, not behind a shared provider interface — mirrors ADR-0001's "prove it twice before generalizing" reasoning, applied to the data layer instead of the UI layer.
