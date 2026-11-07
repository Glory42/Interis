---
title: Likes
description: Read a user's liked movie and TV media.
---

## Endpoint

```txt
GET /api/public/:username/likes?limit=50
```

## Path params

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | yes | Interis username to resolve |

## Query params

| Param | Type | Default | Max | Description |
| --- | --- | ---: | ---: | --- |
| `limit` | number | 50 | 200 | Number of liked rows to return |

## Response

```json
[
  {
    "tmdbId": 550,
    "title": "Fight Club",
    "posterPath": "/a.jpg",
    "releaseYear": 1999,
    "runtime": 139,
    "genres": [
      { "id": 18, "name": "Drama" }
    ],
    "mediaType": "movie",
    "lastInteractionAt": "2026-01-10T12:00:00.000Z"
  }
]
```

### Notes

- Includes both `movie` and `tv` rows.
- Sorted by `lastInteractionAt` descending.
- `genres` is an array of `{ id, name }` or `null`; `runtime` can be `null` (for TV it is the episode runtime).
- `lastInteractionAt` is the last time the user's interaction row for that title changed (like, rating, watchlist, ...), not strictly when it was liked.

## Empty state behavior

Returns `[]` when no likes exist.

## Error behavior

- `404` when username does not exist.
- `429` when the public rate limit is exceeded.
- `500` for unexpected server errors.

## Examples

### fetch

```js
const res = await fetch('https://api.interis.gorkemkaryol.dev/api/public/your_username/likes?limit=20');
if (!res.ok) throw new Error(`Likes failed: ${res.status}`);

const likes = await res.json();
```

### cURL

```bash
curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/likes?limit=20"
```

### Practical: split movie vs TV

```js
const likedMovies = likes.filter((item) => item.mediaType === 'movie');
const likedSeries = likes.filter((item) => item.mediaType === 'tv');
```

Next: [Watchlist endpoint](/api/endpoints/watchlist/)
