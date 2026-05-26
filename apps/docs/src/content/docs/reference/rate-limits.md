---
title: Rate Limits
description: Public API request limits and response-header behavior.
---

## Public endpoint limiters

Interis applies two stacked rate limiters to `/api/public/*`:

### Per-IP limiter

- window: **1 minute**
- max: **60 requests per IP**
- scope: all public endpoints combined

### Per-IP + username limiter

- window: **1 minute**
- max: **10 requests per IP per username**
- scope: keyed on `IP:username` — limits how aggressively one IP can
  fetch a specific user's data regardless of which endpoint is called

A request must pass **both** limiters. The per-username bucket is the
binding constraint for consumers reading a single user's data.

## Relation to global API limiter

The global `/api` limiter skips `/public/*`, so public traffic is governed by the dedicated
public limiters above rather than the broader API cap.

## Headers

Public responses include standard rate-limit headers from `express-rate-limit`
(`standardHeaders: true`, `legacyHeaders: false`).

Use `curl -i` to inspect them:

```bash
curl -i "https://api.interis.gorkemkaryol.dev/api/public/your_username/profile"
```

## Caching behavior

Successful public responses set:

```txt
Cache-Control: public, max-age=60, stale-while-revalidate=120
Vary: Accept-Encoding
```

Browsers and CDN edges cache each response for 60 seconds. During the
120-second stale-while-revalidate window, a stale response is served
immediately while a background revalidation occurs. This means widget
page reloads within the same minute don't count against the rate limit.

## Practical guidance

- Batch related calls (`Promise.all`) when possible to stay within the
  10 req/min per-username cap on a single widget load.
- The 60 s cache window means polling faster than once per minute gives
  no benefit — you'll receive a cached response anyway.
- Avoid aggressive polling from client-side widgets.
