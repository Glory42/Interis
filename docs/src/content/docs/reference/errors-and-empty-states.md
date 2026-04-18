---
title: Errors & Empty States
description: Status code behavior and empty-response conventions for public routes.
---

## Status codes

| Status | Meaning | Body |
| ---: | --- | --- |
| `200` | Successful read | JSON payload |
| `404` | Username not found | `{ "error": "User not found" }` |
| `429` | Public rate limit exceeded | Default `express-rate-limit` payload |
| `500` | Unexpected backend error | `{ "error": "Internal server error" }` |

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

## Query normalization behavior

Endpoints that accept `limit` do not fail on bad values.

Instead, Interis normalizes to fallback defaults:

- missing / invalid `limit` -> default
- decimal -> floored integer
- too large -> clamped to endpoint max
- non-positive -> default

## Consumer recommendation

Treat all list-like endpoints as possibly empty and handle them directly in UI:

```js
const rows = await fetchRows();
if (rows.length === 0) {
  return renderEmptyState();
}
```
