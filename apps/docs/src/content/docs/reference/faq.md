---
title: FAQ
description: Common questions about Interis public API usage.
---

## Do I need auth tokens?

No. Public endpoints are read-only and username-based.

## Can I use this as a general partner API?

Not currently. This API is intentionally small and geared toward personal/friends projects,
widgets, and automations.

## Why do I get CORS errors in the browser?

Backend CORS checks the `CORS_ORIGIN` allow-list. If your site origin is not listed, browser calls get `403` with code `CORS_NOT_ALLOWED`.

Use server-side requests (or update backend CORS config) when integrating from external origins.

## What is the difference between `recent` and `activity`?

They return the same feed item schema. The difference is limit defaults/max:

- `recent`: default `10`, max `20`
- `activity`: default `30`, max `100`

## Are private lists exposed?

No. `/lists` filters to `isPublic = true`.

## Are likes and watchlist movie-only?

No. Both can include `movie` and `tv` items.

## What scale are ratings on?

0.5–10 in 0.5 steps, or `null` when unrated.

## Is pagination supported?

Only on `/diary`, which accepts `offset` (max `5000`) alongside `limit`. Other endpoints support `limit` only (where applicable).

## Are response dates strings or numbers?

They are serialized JSON date strings: ISO 8601 for datetime fields, `YYYY-MM-DD` for `watchedDate`.
One exception: `lastWatchedAt` on `/serials/currently-watching` is currently in Postgres format (`2026-11-06 22:42:49.515805+00`).
