---
title: Diary
description: Read a user's public diary entries across movies and TV.
---

## Endpoint

```txt
GET /api/public/:username/diary?limit=50
```

## Path params

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | yes | Interis username to resolve |

## Query params

| Param | Type | Default | Max | Description |
| --- | --- | ---: | ---: | --- |
| `limit` | number | 50 | 200 | Number of diary rows to return |

## Response

```json
[
  {
    "id": "entry-id",
    "mediaType": "movie",
    "watchedDate": "2026-01-10",
    "ratingOutOfTen": 8,
    "ratingOutOfFive": 4,
    "rewatch": false,
    "createdAt": "2026-01-10T12:00:00.000Z",
    "updatedAt": "2026-01-10T12:00:00.000Z",
    "media": {
      "tmdbId": 550,
      "title": "Fight Club",
      "posterPath": "/a.jpg",
      "releaseYear": 1999
    },
    "review": {
      "id": "review-id",
      "content": "Great rewatch.",
      "containsSpoilers": false,
      "createdAt": "2026-01-10T12:00:00.000Z"
    }
  }
]
```

### Notes

- Includes both `movie` and `tv` entries.
- Results are merged and sorted by `watchedDate` desc, then `createdAt` desc.
- `review` can be `null` when no linked review exists.

## Empty state behavior

Returns `[]` when diary has no entries.

## Error behavior

- `404` when username does not exist.
- `429` when the public rate limit is exceeded.
- `500` for unexpected server errors.

## Examples

### fetch

```js
const res = await fetch('https://api.interis.gorkemkaryol.dev/api/public/your_username/diary?limit=30');
if (!res.ok) throw new Error(`Diary failed: ${res.status}`);

const diary = await res.json();
```

### cURL

```bash
curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/diary?limit=30"
```

### Practical: isolate rewatch entries

```js
const rewatches = diary.filter((entry) => entry.rewatch);
```

Next: [Activity endpoint](/api/endpoints/activity/)
