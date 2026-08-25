---
title: Serials Watched
description: Read a user's fully watched TV series.
---

## Endpoint

```txt
GET /api/public/:username/serials/watched?limit=50
```

Returns TV series the user has explicitly marked as fully watched. For series that are started but not finished, see [Serials Currently Watching](/api/endpoints/serials-currently-watching/).

## Path params

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | yes | Interis username to resolve |

## Query params

| Param | Type | Default | Max | Description |
| --- | --- | ---: | ---: | --- |
| `limit` | number | 50 | 200 | Number of watched series to return |

## Response

```json
[
  {
    "tmdbId": 1396,
    "title": "Breaking Bad",
    "posterPath": "/gg40uwtwFcYRL5O4YKwtqqMK5AY.jpg",
    "backdropPath": "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    "firstAirYear": 2008,
    "numberOfSeasons": 5,
    "numberOfEpisodes": 62,
    "mediaType": "tv",
    "lastInteractionAt": "2026-01-10T12:00:00.000Z"
  }
]
```

### Notes

- "Watched" here is the explicit series-level flag set when a user marks the whole series watched — the same flag used elsewhere in the app (independent of per-episode tracking). It is not derived from episode-completion counts.
- Sorted by `lastInteractionAt` descending (most recently marked watched first).
- Does not include per-season/episode progress. For that level of detail on one specific series, see [Serials Progress](/api/endpoints/serials-progress/).

## Empty state behavior

Returns `[]` when the user hasn't marked any series fully watched.

## Error behavior

- `404` when the user does not exist.
- `429` when the public rate limit is exceeded.
- `500` for unexpected server errors.

## Examples

### fetch

```js
const res = await fetch('https://api.interis.gorkemkaryol.dev/api/public/your_username/serials/watched?limit=20');
if (!res.ok) throw new Error(`Serials Watched failed: ${res.status}`);

const watched = await res.json();
```

### cURL

```bash
curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/serials/watched?limit=20"
```

Related: [Movies Watched](/api/endpoints/movies-watched/) · [Serials Currently Watching](/api/endpoints/serials-currently-watching/)
