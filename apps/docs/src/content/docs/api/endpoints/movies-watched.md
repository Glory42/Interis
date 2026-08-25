---
title: Movies Watched
description: Read a user's watched movies (film-only).
---

## Endpoint

```txt
GET /api/public/:username/movies/watched?limit=50
```

Returns movies the user has marked as watched. Unlike [Likes](/api/endpoints/likes/) and [Watchlist](/api/endpoints/watchlist/), this endpoint is film-only — it does not include TV series.

## Path params

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | yes | Interis username to resolve |

## Query params

| Param | Type | Default | Max | Description |
| --- | --- | ---: | ---: | --- |
| `limit` | number | 50 | 200 | Number of watched rows to return |

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

- Film-only. For a combined movie + TV "liked"/"watchlisted" view, see [Likes](/api/endpoints/likes/) and [Watchlist](/api/endpoints/watchlist/).
- Sorted by `lastInteractionAt` descending (most recently marked watched first).
- `isWatched` is a direct flag on the movie interaction row, independent of like/rating/watchlist state.

## Empty state behavior

Returns `[]` when the user hasn't marked any movies watched.

## Error behavior

- `404` when username does not exist.
- `429` when the public rate limit is exceeded.
- `500` for unexpected server errors.

## Examples

### fetch

```js
const res = await fetch('https://api.interis.gorkemkaryol.dev/api/public/your_username/movies/watched?limit=20');
if (!res.ok) throw new Error(`Movies Watched failed: ${res.status}`);

const watched = await res.json();
```

### cURL

```bash
curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/movies/watched?limit=20"
```

Related: [Serials Watched](/api/endpoints/serials-watched/)
