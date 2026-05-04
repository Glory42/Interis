---
title: Top 4
description: Read top picks grouped by Interis categories.
---

## Endpoint

```txt
GET /api/public/:username/top4
```

Returns user top picks grouped by category.

## Path params

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | yes | Interis username to resolve |

## Query params

None.

## Response

```json
{
  "categories": [
    {
      "id": 1,
      "key": "cinema",
      "supported": true,
      "items": [
        {
          "slot": 1,
          "mediaType": "movie",
          "mediaSource": "tmdb",
          "mediaSourceId": "550",
          "entityId": 123,
          "tmdbId": 550,
          "title": "Fight Club",
          "posterPath": "/a.jpg",
          "releaseYear": 1999
        }
      ]
    },
    {
      "id": 2,
      "key": "serial",
      "supported": true,
      "items": []
    }
  ]
}
```

### Notes

- Categories are currently fixed to `cinema` (`id: 1`) and `serial` (`id: 2`).
- `items` are sorted by `slot`.
- `entityId` and `tmdbId` can be `null` for unresolved/non-TMDB records.

## Empty state behavior

- Existing users still receive `categories`.
- A category with no picks returns `items: []`.

## Error behavior

- `404` when username does not exist.
- `429` when the public rate limit is exceeded.
- `500` for unexpected server errors.

## Examples

### fetch

```js
const res = await fetch(`https://api.interis.gorkemkaryol.dev/api/public/your_username/top4`);
if (!res.ok) throw new Error(`Top4 failed: ${res.status}`);

const data = await res.json();
const cinema = data.categories.find((category) => category.key === 'cinema');
console.log(cinema?.items ?? []);
```

### cURL

```bash
curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/top4"
```

### Practical: map categories into sections

```js
function toTopPickSections(response) {
  return response.categories.map((category) => ({
    key: category.key,
    heading: category.key === 'cinema' ? 'Top 4 Films' : 'Top 4 Series',
    items: category.items,
  }));
}
```

Next: [Recent endpoint](/api/endpoints/recent/)
