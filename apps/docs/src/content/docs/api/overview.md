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

## Response conventions

- **HTTP 200** for successful reads.
- **HTTP 404** with `{ "error": "User not found" }` when username is missing.
- **HTTP 429** when public rate limit is exceeded.
- **HTTP 500** with `{ "error": "Internal server error" }` for unhandled errors.
- `Cache-Control: no-store` is set on successful public responses.

## Rate limiting

Public routes use a dedicated limiter:

- window: `1 minute`
- max: `60 requests per IP`

The broader `/api` limiter is configured to skip `/public/*`, so public traffic is governed by the dedicated limiter above.

## Data visibility notes

- Lists endpoint returns only rows where `isPublic = true`.
- Likes/watchlist include both movie and TV rows.
- Diary includes both movie and TV entries merged and sorted by watched date.
- Activity/recent return the same feed item shape, but with different default/max limits.

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
