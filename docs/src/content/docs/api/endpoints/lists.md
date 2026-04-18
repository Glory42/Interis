---
title: Lists
description: Read a user's public lists and their ordered entries.
---

## Endpoint

```txt
GET /api/public/:username/lists?limit=50
```

## Path params

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | yes | Interis username to resolve |

## Query params

| Param | Type | Default | Max | Description |
| --- | --- | ---: | ---: | --- |
| `limit` | number | 50 | 200 | Number of lists to return |

## Response

```json
[
  {
    "id": "list-id",
    "title": "Best Thrillers",
    "description": "Favorites for suspense nights.",
    "isRanked": true,
    "createdAt": "2026-01-01T12:00:00.000Z",
    "updatedAt": "2026-01-08T12:00:00.000Z",
    "itemCount": 2,
    "items": [
      {
        "position": 1,
        "note": "All-time favorite",
        "tmdbId": 680,
        "title": "Pulp Fiction",
        "posterPath": "/p.jpg",
        "releaseYear": 1994
      }
    ]
  }
]
```

### Notes

- Returns only lists where `isPublic = true`.
- Lists are ordered by `updatedAt` then `createdAt` (descending).
- Items are ordered by `position`.
- Current list entries are movie-backed.

## Empty state behavior

Returns `[]` when no public lists exist.

## Error behavior

- `404` when username does not exist.
- `429` when the public rate limit is exceeded.
- `500` for unexpected server errors.

## Examples

### fetch

```js
const res = await fetch('https://api.interis.gorkemkaryol.dev/api/public/your_username/lists?limit=10');
if (!res.ok) throw new Error(`Lists failed: ${res.status}`);

const lists = await res.json();
console.log(lists.length);
```

### cURL

```bash
curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/lists?limit=10"
```

### Practical: render a ranked list only

```js
const ranked = lists.filter((list) => list.isRanked);
```

Next: [Likes endpoint](/api/endpoints/likes/)
