---
title: Reviews
description: Read a user's public review list across movie and TV entries.
---

## Endpoint

```txt
GET /api/public/:username/reviews?limit=50
```

## Path params

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | yes | Interis username to resolve |

## Query params

| Param | Type | Default | Max | Description |
| --- | --- | ---: | ---: | --- |
| `limit` | number | 50 | 200 | Number of rows to return |

## Response

Returns a time-descending array.

```json
[
  {
    "id": "review-id",
    "content": "A sharp and tense watch.",
    "containsSpoilers": false,
    "createdAt": "2026-01-10T12:00:00.000Z",
    "updatedAt": "2026-01-10T12:00:00.000Z",
    "tmdbId": 550,
    "title": "Fight Club",
    "posterPath": "/a.jpg",
    "releaseYear": 1999,
    "ratingOutOfFive": 4,
    "mediaType": "movie"
  }
]
```

### Notes

- Includes both `movie` and `tv` rows.
- `ratingOutOfFive` can be `null`.
- Results are fetched, then sliced to `limit`.

## Empty state behavior

Returns `[]` when no reviews exist.

## Error behavior

- `404` when username does not exist.
- `429` when the public rate limit is exceeded.
- `500` for unexpected server errors.

## Examples

### fetch

```js
const res = await fetch('https://api.interis.gorkemkaryol.dev/api/public/your_username/reviews?limit=12');
if (!res.ok) throw new Error(`Reviews failed: ${res.status}`);

const reviews = await res.json();
console.log(reviews.map((review) => review.title));
```

### cURL

```bash
curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/reviews?limit=12"
```

### Practical: spoiler-safe subset

```js
const spoilerSafe = reviews.filter((review) => !review.containsSpoilers);
```

Next: [Lists endpoint](/api/endpoints/lists/)
