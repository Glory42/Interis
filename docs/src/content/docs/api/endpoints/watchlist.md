---
title: Watchlist
description: Read a user's watchlisted movie and TV media.
---

## Endpoint

```txt
GET /api/public/:username/watchlist?limit=50
```

## Path params

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | yes | Interis username to resolve |

## Query params

| Param | Type | Default | Max | Description |
| --- | --- | ---: | ---: | --- |
| `limit` | number | 50 | 200 | Number of watchlist rows to return |

## Response

Response shape matches [Likes](/api/endpoints/likes/):

```json
[
  {
    "tmdbId": 1399,
    "title": "Game of Thrones",
    "posterPath": "/got.jpg",
    "releaseYear": 2011,
    "runtime": 60,
    "genres": [
      { "id": 10765, "name": "Sci-Fi & Fantasy" }
    ],
    "mediaType": "tv",
    "lastInteractionAt": "2026-01-10T12:00:00.000Z"
  }
]
```

### Notes

- Includes both `movie` and `tv` rows.
- Sorted by `lastInteractionAt` descending.

## Empty state behavior

Returns `[]` when watchlist is empty.

## Error behavior

- `404` when username does not exist.
- `429` when the public rate limit is exceeded.
- `500` for unexpected server errors.

## Examples

### fetch

```js
const res = await fetch('https://api.interis.gorkemkaryol.dev/api/public/your_username/watchlist?limit=25');
if (!res.ok) throw new Error(`Watchlist failed: ${res.status}`);

const watchlist = await res.json();
```

### cURL

```bash
curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/watchlist?limit=25"
```

### Practical: build an "Up Next" rail

```js
const upNext = watchlist.slice(0, 6);
```

Next: [Diary endpoint](/api/endpoints/diary/)
