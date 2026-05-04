---
title: Recent
description: Read a compact slice of a user's latest activity feed.
---

## Endpoint

```txt
GET /api/public/:username/recent?limit=10
```

Returns the same feed item shape as `/activity`, but intended for smaller widgets.

## Path params

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | yes | Interis username to resolve |

## Query params

| Param | Type | Default | Max | Description |
| --- | --- | ---: | ---: | --- |
| `limit` | number | 10 | 20 | Number of items to return |

`limit` values are normalized (invalid/empty values fall back to default).

## Response

Returns `FeedItem[]`.

```json
[
  {
    "id": "activity-id",
    "type": "review",
    "kind": "review",
    "createdAt": "2026-01-10T12:00:00.000Z",
    "actor": {
      "id": "user-id",
      "username": "your_username",
      "displayUsername": "Your Username",
      "image": null,
      "avatarUrl": null
    },
    "movie": {
      "tmdbId": 550,
      "title": "Fight Club",
      "posterPath": "/a.jpg",
      "releaseYear": 1999,
      "mediaType": "movie"
    },
    "post": null,
    "review": {
      "id": "review-id",
      "content": "Great rewatch.",
      "containsSpoilers": false,
      "rating": 8
    },
    "metadata": {
      "action": null,
      "excerpt": null,
      "targetUsername": null,
      "rating": 8,
      "rewatch": false,
      "hasReview": true,
      "mediaType": "movie",
      "containsSpoilers": false,
      "reviewId": "review-id",
      "commentId": null,
      "movieId": 550,
      "postId": null,
      "postMediaId": null,
      "postMediaType": null
    },
    "engagement": {
      "likeCount": 3,
      "commentCount": 1,
      "viewerHasLiked": null
    }
  }
]
```

For full field guidance, see [Data Shapes](/reference/data-shapes/).

## Empty state behavior

Returns `[]` when the user has no feed items.

## Error behavior

- `404` when username does not exist.
- `429` when the public rate limit is exceeded.
- `500` for unexpected server errors.

## Examples

### fetch

```js
const limit = 5;
const res = await fetch(`https://api.interis.gorkemkaryol.dev/api/public/your_username/recent?limit=${limit}`);
if (!res.ok) throw new Error(`Recent failed: ${res.status}`);

const items = await res.json();
console.log(items.length);
```

### cURL

```bash
curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/recent?limit=5"
```

### Practical: render latest review-like events

```js
const reviewish = items.filter((item) =>
  ['review', 'liked_review'].includes(item.kind)
);
```

Next: [Reviews endpoint](/api/endpoints/reviews/)
