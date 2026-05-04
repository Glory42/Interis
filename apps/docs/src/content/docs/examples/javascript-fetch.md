---
title: JavaScript / fetch
description: Copy-paste fetch examples for common public API usage.
---

## Base helper

```js
const API_BASE = 'https://api.interis.gorkemkaryol.dev';

async function getPublic(username, path, params = {}) {
  const url = new URL(`/api/public/${encodeURIComponent(username)}${path}`, API_BASE);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Public API request failed (${response.status})`);
  }

  return response.json();
}
```

## Fetch profile + top picks together

```js
const username = 'your_username';

const [profile, top4] = await Promise.all([
  getPublic(username, '/profile'),
  getPublic(username, '/top4'),
]);

console.log(profile.username, top4.categories.length);
```

## Fetch compact recent activity

```js
const recent = await getPublic('your_username', '/recent', { limit: 5 });
const rows = recent.map((item) => ({
  id: item.id,
  kind: item.kind,
  createdAt: item.createdAt,
}));
console.table(rows);
```

## Fetch review feed for a widget

```js
const reviews = await getPublic('your_username', '/reviews', { limit: 8 });
const widgetRows = reviews.map((review) => ({
  id: review.id,
  media: `${review.title} (${review.mediaType})`,
  rating: review.ratingOutOfFive,
}));
```

## Notes

- Public routes are rate limited. Batch and cache on your side if possible.
- For third-party browser apps, check CORS configuration in backend `CORS_ORIGIN`.
- If you do not control API CORS config, call the API server-side.
