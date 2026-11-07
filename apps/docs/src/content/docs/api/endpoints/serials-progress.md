---
title: Serials Progress
description: Read a user's tracking progress and interactive stats for a specific TV show/serial.
---

## Endpoint

```txt
GET /api/public/:username/serials/:tmdbId
```

Returns the watch progress, season-by-season interactions, and rating/like/review counters for the specified TV series.

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
    "watchedSpecialEpisodesCount": 0,
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
        "hasReview": true,
        "watchedEpisodeCount": 3
      }
    }
  ]
}
```

### Notes

- `viewerTracking` is always an object. If the user hasn't tracked the series, its counts are `0` and `watchedEpisodes` is `[]`.
- `series.id` is Interis' internal id; it is `0` when the series isn't cached locally yet.
- `seasons` includes season 0 (Specials) when TMDB lists it, and is `[]` if TMDB details can't be loaded.
- Season `rating` is 0.5–10 in 0.5 steps, or `null`.
- `currentEpisode` returns the first unwatched episode in chronological order (Up Next). If all episodes are watched, `currentEpisode` returns `null`.
- `ratingsCount`, `likesCount`, and `reviewsCount` aggregate interactions from both seasons and individual episodes.
- `series.numberOfEpisodes` excludes season 0 (Specials) — only regular aired seasons count. `watchedEpisodesCount` is counted the same way, so the progress fraction is always consistent. Watched specials are reported separately in `watchedSpecialEpisodesCount`.

## Empty state behavior

There is no empty variant: for a valid series the user never tracked, the response has zeroed `viewerTracking` counts and `false`/`null` season interactions.

## Error behavior

- `400` with `{ "error": { "message": "Invalid tmdbId", "code": "BAD_REQUEST" } }` when `tmdbId` is not a number.
- `404` when the user does not exist (`"User not found"`) or TMDB has no series with that id (`"Series not found"`).
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
console.log(`Watched: ${progress.viewerTracking.watchedEpisodesCount} / ${progress.series.numberOfEpisodes}`);
```

### cURL

```bash
curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/serials/1396"
```
