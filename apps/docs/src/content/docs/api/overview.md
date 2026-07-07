---
title: API Overview
description: Public API scope, endpoint behavior, and implementation-backed notes.
---

## Scope

Interis currently exposes a **public read-only API** mounted at:

```txt
/api/public
```

All routes are `GET` and use `:username` path params.

## Implemented endpoints

| Path | Default `limit` | Max `limit` | Notes |
| --- | ---: | ---: | --- |
| `/api/public/:username/profile` | - | - | Profile summary + stats |
| `/api/public/:username/top4` | - | - | Top picks by category |
| `/api/public/:username/recent` | 10 | 20 | Activity feed (compact) |
| `/api/public/:username/activity` | 30 | 100 | Activity feed (expanded) |
| `/api/public/:username/reviews` | 50 | 200 | Movie + TV reviews |
| `/api/public/:username/lists` | 50 | 200 | Public lists only |
| `/api/public/:username/likes` | 50 | 200 | Liked movie + TV media |
| `/api/public/:username/watchlist` | 50 | 200 | Watchlisted movie + TV media |
| `/api/public/:username/diary` | 50 | 200 | Movie + TV diary entries |
| `/api/public/:username/movies/watched` | 50 | 200 | Watched movies (film-only) |
| `/api/public/:username/serials/:tmdbId` | - | - | Serial progress + stats |
| `/api/public/:username/serials/currently-watching` | 10 | 30 | In-progress serials, most recent first |
| `/api/public/:username/serials/watched` | 50 | 200 | Fully watched serials (series-only) |

## Response conventions

- **HTTP 200** for successful reads.
- **HTTP 404** with `{ "error": "User not found" }` when username is missing.
- **HTTP 429** when a rate limit is exceeded.
- **HTTP 500** with `{ "error": "Internal server error" }` for unhandled errors.
- `Cache-Control: public, max-age=60, stale-while-revalidate=120` is set on successful public responses.

## Rate limiting

Public routes use a dedicated per-IP limiter:

| Limiter | Window | Max | Key |
| --- | --- | --- | --- |
| Per-IP | 1 min | 60 requests | `IP` |

See [Rate Limits](/reference/rate-limits/) for full details.

The broader `/api` limiter is configured to skip `/public/*`, so public traffic is governed by the dedicated limiter above.

## Data visibility notes

- Lists endpoint returns only rows where `isPublic = true`.
- Likes/watchlist include both movie and TV rows.
- Diary includes both movie and TV entries merged and sorted by watched date.
- Activity/recent return the same feed item shape, but with different default/max limits.
- Currently-watching excludes series explicitly marked fully watched, and requires at least one watched episode.
- Movies watched / serials watched are each film-only or series-only (unlike likes/watchlist, which mix both media types).

## Endpoint docs

Use the detailed pages for params, field notes, and examples:

- [Profile](/api/endpoints/profile/)
- [Top 4](/api/endpoints/top4/)
- [Recent](/api/endpoints/recent/)
- [Reviews](/api/endpoints/reviews/)
- [Lists](/api/endpoints/lists/)
- [Likes](/api/endpoints/likes/)
- [Watchlist](/api/endpoints/watchlist/)
- [Diary](/api/endpoints/diary/)
- [Activity](/api/endpoints/activity/)
- [Movies Watched](/api/endpoints/movies-watched/)
- [Serials Progress](/api/endpoints/serials-progress/)
- [Serials Currently Watching](/api/endpoints/serials-currently-watching/)
- [Serials Watched](/api/endpoints/serials-watched/)
