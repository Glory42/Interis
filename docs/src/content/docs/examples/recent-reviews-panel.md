---
title: Recent Reviews Panel
description: Build a compact panel for latest review-focused content.
---

This pattern combines `recent` and `reviews` for a review-heavy sidebar.

## Why combine two endpoints?

- `recent` gives timeline recency and activity kinds.
- `reviews` gives stable review media details.

## Example

```js
const base = 'https://api.interis.gorkemkaryol.dev';
const username = 'your_username';

const [recentRes, reviewsRes] = await Promise.all([
  fetch(`${base}/api/public/${username}/recent?limit=12`),
  fetch(`${base}/api/public/${username}/reviews?limit=12`),
]);

if (!recentRes.ok || !reviewsRes.ok) {
  throw new Error('Failed to load panel data');
}

const recent = await recentRes.json();
const reviews = await reviewsRes.json();

const reviewLikeEvents = recent.filter((item) =>
  ['review', 'liked_review'].includes(item.kind)
);

const panelRows = reviewLikeEvents.map((event) => {
  const match = reviews.find((review) => review.id === event.review?.id);
  return {
    activityId: event.id,
    title: match?.title ?? event.movie?.title ?? 'Unknown media',
    excerpt: event.review?.content ?? match?.content ?? '',
    createdAt: event.createdAt,
  };
});
```

## Rendering idea

Show each row with:

- media title
- short excerpt (or spoiler-safe fallback)
- activity timestamp
- optional poster thumbnail

For spoiler-safe UIs, avoid rendering `review.content` when `containsSpoilers` is true.
