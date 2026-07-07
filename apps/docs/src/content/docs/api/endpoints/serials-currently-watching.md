---
title: Serials Currently Watching
description: Read a user's list of TV shows/serials they've started but not finished watching.
---

## Endpoint

```txt
GET /api/public/:username/serials/currently-watching
```

Returns the TV series the user has watched at least one episode of, but hasn't fully watched yet, ordered by most recent watch activity. Series the user has explicitly marked as fully watched are excluded, even if newer episodes exist.

## Path params

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | yes | Interis username to resolve |

## Query params

| Param | Type | Default | Max |
| --- | --- | --- | --- |
| `limit` | number | 10 | 30 |

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
    "watchedEpisodesCount": 14,
    "progressPercent": 23,
    "lastWatchedAt": "2026-07-01T12:00:00.000Z",
    "currentEpisode": {
      "seasonNumber": 1,
      "episodeNumber": 4,
      "name": "Episode 4"
    }
  }
]
```

### Notes

- Ordered by `lastWatchedAt` descending — most recently watched series first.
- `progressPercent` is `watchedEpisodesCount / numberOfEpisodes`, rounded to the nearest whole percent.
- `currentEpisode` is the first unwatched episode in chronological order (Up Next). It can be `null` if the locally cached `numberOfEpisodes` is behind the show's true episode count on TMDB.
- `numberOfEpisodes`/`numberOfSeasons` reflect the last time this series was cached locally and can lag TMDB briefly for currently-airing shows.

## Empty state behavior

Returns `[]` if the user has no series in progress (nothing started, or everything is either finished or not yet begun).

## Error behavior

- `404` when the user does not exist.
- `429` when the public rate limit is exceeded.
- `500` for unexpected server errors.

## Examples

### fetch

```js
const username = 'your_username';
const res = await fetch(`https://api.interis.gorkemkaryol.dev/api/public/${username}/serials/currently-watching`);

if (!res.ok) throw new Error(`Currently Watching request failed: ${res.status}`);

const currentlyWatching = await res.json();
for (const series of currentlyWatching) {
  console.log(`${series.title}: ${series.progressPercent}% (${series.watchedEpisodesCount}/${series.numberOfEpisodes})`);
}
```

### cURL

```bash
curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/serials/currently-watching?limit=5"
```
