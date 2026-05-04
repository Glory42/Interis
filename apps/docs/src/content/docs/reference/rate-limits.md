---
title: Rate Limits
description: Public API request limits and response-header behavior.
---

## Public endpoint limiter

Interis applies a dedicated rate limiter to `/api/public/*`:

- window: **1 minute**
- max: **60 requests per IP**

This limiter is configured in the public router.

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

Successful public responses currently set:

```txt
Cache-Control: no-store
```

If you need caching, do it in your own consumer layer (server cache, edge cache, or app-level memoization).

## Practical guidance

- Batch related calls (`Promise.all`) when possible.
- Reuse fetched data between components.
- Avoid aggressive polling from client-side widgets.
