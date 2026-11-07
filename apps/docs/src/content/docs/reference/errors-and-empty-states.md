---
title: Errors & Empty States
description: Status code behavior and empty-response conventions for public routes.
---

## Status codes

| Status | Meaning | Body |
| ---: | --- | --- |
| `200` | Successful read | JSON payload |
| `400` | Non-numeric `tmdbId` on `/serials/:tmdbId` | `{ "error": { "message": "Invalid tmdbId", "code": "BAD_REQUEST" } }` |
| `404` | Username not found | `{ "error": { "message": "User not found", "code": "NOT_FOUND" } }` |
| `404` | Unknown series on `/serials/:tmdbId` | `{ "error": { "message": "Series not found", "code": "NOT_FOUND" } }` |
| `429` | Public rate limit exceeded | Plain text: `Too many requests, please try again later.` |
| `500` | Unexpected backend error | `{ "error": { "message": "Internal server error", "code": "INTERNAL_SERVER_ERROR" } }` |

## Empty-state behavior by endpoint

| Endpoint | Empty state |
| --- | --- |
| `/profile` | No special empty object; returns `404` if user missing |
| `/top4` | Always returns categories; category items can be empty arrays |
| `/recent` | `[]` |
| `/activity` | `[]` |
| `/reviews` | `[]` |
| `/lists` | `[]` |
| `/likes` | `[]` |
| `/watchlist` | `[]` |
| `/diary` | `[]` |
| `/movies/watched` | `[]` |
| `/serials/currently-watching` | `[]` |
| `/serials/watched` | `[]` |
| `/serials/:tmdbId` | Always an object; untracked series have zeroed `viewerTracking` counts. `404` if user or series missing |

## Query normalization behavior

Endpoints that accept `limit` (and `offset` on `/diary`) do not fail on bad values.

Instead, Interis normalizes to fallback defaults:

- missing / invalid `limit` -> default
- decimal -> floored integer
- too large -> clamped to endpoint max
- non-positive -> default

`offset` follows the same rules with a default of `0` and a max of `5000`.

## Consumer recommendation

Treat all list-like endpoints as possibly empty and handle them directly in UI:

```js
const rows = await fetchRows();
if (rows.length === 0) {
  return renderEmptyState();
}
```
