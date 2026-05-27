---
title: Rate Limits
description: Public API request limits and response-header behavior.
---

## Public endpoint limiter

Interis applies a single rate limiter to `/api/public/*`:

### Per-IP limiter

- window: **1 minute**
- max: **60 requests per IP**
- scope: all public endpoints combined

## Relation to global API limiter

The global `/api` limiter skips `/public/*`, so public traffic is governed by the dedicated
public limiter above rather than the broader API cap.

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

- The 60 s cache window means polling faster than once per minute gives
  no benefit — you'll receive a cached response anyway.
- Avoid aggressive polling from client-side widgets.
