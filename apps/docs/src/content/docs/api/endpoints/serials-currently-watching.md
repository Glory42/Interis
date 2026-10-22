---
title: Serials Currently Watching
description: Read the TV series a user is currently watching.
---

## Endpoint

```txt
GET /api/public/:username/serials/currently-watching
```

Returns the TV series whose watch status is **watching**, ordered by most recent watch activity. A series becomes "watching" when the user checks its first regular episode, and leaves this list when every episode is watched (completed), when the user pauses or drops it, or when every episode is unchecked. Specials (season 0) don't count toward progress, so watching only specials doesn't put a series on this list. A completed series comes back here when new episodes air, as long as the user had tracked it episode by episode.

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
- `numberOfEpisodes` excludes season 0 (Specials). `watchedEpisodesCount` and `progressPercent` are computed the same way, so the fraction is always consistent.
- `numberOfEpisodes`/`numberOfSeasons` reflect the last time this series was cached locally and can lag TMDB briefly for currently-airing shows.

## Empty state behavior

Returns `[]` if the user has no series with the watching status (nothing started, or everything is completed, paused, or dropped).

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
