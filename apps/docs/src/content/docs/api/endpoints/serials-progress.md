---
title: Serials Progress
description: Read a user's tracking progress and interactive stats for a specific TV show/serial.
---

## Endpoint

```txt
GET /api/public/:username/serials/:tmdbId
```

Returns the watch progress, season-by-season interactions, custom reviews, ratings, and like counters for the specified TV series.

## Path params

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | yes | Interis username to resolve |
| `tmdbId` | number | yes | TMDB ID of the TV series to fetch progress for |

## Query params

None.

## Response

```json
{
  "series": {
    "id": 12,
    "tmdbId": 1396,
    "title": "Breaking Bad",
    "posterPath": "/gg40uwtwFcYRL5O4YKwtqqMK5AY.jpg",
    "numberOfSeasons": 5,
    "numberOfEpisodes": 62
  },
  "viewerTracking": {
    "watchedEpisodesCount": 14,
    "watchedEpisodes": [
      { "seasonNumber": 1, "episodeNumber": 1 },
      { "seasonNumber": 1, "episodeNumber": 2 },
      { "seasonNumber": 1, "episodeNumber": 3 }
    ],
    "currentEpisode": {
      "seasonNumber": 1,
      "episodeNumber": 4,
      "name": "Episode 4"
    },
    "ratingsCount": 4,
    "likesCount": 2,
    "reviewsCount": 1
  },
  "seasons": [
    {
      "seasonNumber": 1,
      "name": "Season 1",
      "episodeCount": 7,
      "viewerInteraction": {
        "watched": false,
        "liked": true,
        "rating": 4.5,
        "hasReview": true
      }
    }
  ]
}
```

### Notes

- `viewerTracking` is `null` if the user has no progress recorded for this series.
- `currentEpisode` returns the first unwatched episode in chronological order (Up Next). If all episodes are watched, `currentEpisode` returns `null`.
- `ratingsCount`, `likesCount`, and `reviewsCount` aggregate interactions from both seasons and individual episodes.

## Empty state behavior

If the resolved user has no tracking record for the specified serial, `viewerTracking` returns `null`.

## Error behavior

- `400` when the `tmdbId` path parameter is not a valid number.
- `404` when the user does not exist or series cannot be found.
- `429` when the public rate limit is exceeded.
- `500` for unexpected server errors.

## Examples

### fetch

```js
const username = 'your_username';
const tmdbId = 1396; // Breaking Bad
const res = await fetch(`https://api.interis.gorkemkaryol.dev/api/public/${username}/serials/${tmdbId}`);

if (!res.ok) throw new Error(`Serials Progress request failed: ${res.status}`);

const progress = await res.json();
if (progress.viewerTracking) {
  console.log(`Watched: ${progress.viewerTracking.watchedEpisodesCount} / ${progress.series.numberOfEpisodes}`);
}
```

### cURL

```bash
curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/serials/1396"
```
