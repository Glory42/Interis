---
title: Activity
description: Read a broader user activity feed with a larger default limit.
---

## Endpoint

```txt
GET /api/public/:username/activity?limit=30
```

`/activity` and `/recent` return the same feed item shape. The main difference is limit defaults.

## Path params

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | yes | Interis username to resolve |

## Query params

| Param | Type | Default | Max | Description |
| --- | --- | ---: | ---: | --- |
| `limit` | number | 30 | 100 | Number of feed rows to return |

## Response

Returns `FeedItem[]` (same schema as [Recent](/api/endpoints/recent/)).

Common `kind` values include:

- `diary_entry`
- `review`
- `liked_movie`
- `watchlisted_movie`
- `followed_user`
- `created_list`
- `liked_review`
- `commented`
- `post`
- `liked_comment`
- `liked_post`
- `commented_post`

## Empty state behavior

Returns `[]` when the user has no feed items.

## Error behavior

- `404` when username does not exist.
- `429` when the public rate limit is exceeded.
- `500` for unexpected server errors.

## Examples

### fetch

```js
const res = await fetch('https://api.interis.gorkemkaryol.dev/api/public/your_username/activity?limit=40');
if (!res.ok) throw new Error(`Activity failed: ${res.status}`);

const items = await res.json();
```

### cURL

```bash
curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/activity?limit=40"
```

### Practical: timeline rows for review-related events

```js
const reviewTimeline = items.filter((item) =>
  ['review', 'liked_review'].includes(item.kind)
);
```

Related:

- [Recent endpoint](/api/endpoints/recent/)
- [Data Shapes](/reference/data-shapes/)
