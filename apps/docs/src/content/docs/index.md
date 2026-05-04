---
title: Getting Started
description: Make your first Interis public API request and understand core usage rules.
---

## Who this API is for

Use the Interis public API if you want to show your **public Interis data** in:

- portfolio widgets
- favorites sections
- recent review panels
- watchlist or diary embeds

The API is intentionally simple and read-only.

## Public API base URL

```txt
https://api.interis.gorkemkaryol.dev/api/public
```

Example path:

```txt
GET https://api.interis.gorkemkaryol.dev/api/public/:username/profile
```

## Authentication model

There is no token flow for public routes:

- no bearer tokens
- no OAuth
- no PATs

Every request is username-based.

## First request

```bash
curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/profile"
```

```js
const username = 'your_username';
const res = await fetch(
  `https://api.interis.gorkemkaryol.dev/api/public/${username}/profile`
);

if (!res.ok) {
  throw new Error(`Request failed: ${res.status}`);
}

const profile = await res.json();
console.log(profile.username, profile.stats.reviewCount);
```

## Endpoint map

| Endpoint | Purpose |
| --- | --- |
| `/api/public/:username/profile` | Public profile + counts |
| `/api/public/:username/top4` | Top picks by category |
| `/api/public/:username/recent` | Recent activity feed (compact) |
| `/api/public/:username/activity` | Activity feed (expanded) |
| `/api/public/:username/reviews` | Public reviews |
| `/api/public/:username/lists` | Public lists with entries |
| `/api/public/:username/likes` | Liked movies + series |
| `/api/public/:username/watchlist` | Watchlisted movies + series |
| `/api/public/:username/diary` | Movie + TV diary entries |

## Query limits and normalization

When `limit` is invalid (missing, `0`, negative, NaN), Interis falls back to endpoint defaults.
Valid numbers are floored and clamped to endpoint-specific max values.

## CORS note

Backend CORS still uses an allow-list. If your browser app origin is not allowed,
client-side requests may be blocked.

In that case, call the API server-side from your own backend/function.

## Next steps

- [API Overview](/api/overview/)
- [Profile endpoint](/api/endpoints/profile/)
- [JavaScript examples](/examples/javascript-fetch/)
