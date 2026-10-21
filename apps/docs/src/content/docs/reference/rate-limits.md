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
Cache-Control: public, max-age=300, stale-while-revalidate=600
Vary: Accept-Encoding
```

The server also keeps each response (including `404 User not found`) in
memory for 5 minutes, so data can lag a new log or review by up to 5
minutes. A response served from that cache carries `X-Cache: HIT`.
Browsers and CDN edges cache each response for 5 minutes, and during the
10-minute stale-while-revalidate window a stale response is served
immediately while a background revalidation occurs.

## Practical guidance

- The 5-minute cache window means polling faster than once every 5 minutes
  gives no benefit — you'll receive a cached response anyway.
- Avoid aggressive polling from client-side widgets.
