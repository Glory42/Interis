---
title: Data Shapes
description: Shared response object notes used across Interis public endpoints.
---

This page summarizes common structures so endpoint pages can stay focused.

## Profile object

Returned by `/profile`.

Key fields:

- `username`, `displayUsername`, `name`
- `image`, `avatarUrl`, `bio`, `location`
- `favoriteGenres[]`, `themeId`, `createdAt`
- `stats` with `entryCount`, `reviewCount`, `filmCount`, `listCount`, `followerCount`, `followingCount`

## Top 4 payload

Returned by `/top4`.

- `categories` array with category objects (`id`, `key`, `supported`, `items`)
- Category keys are currently `cinema` and `serial`
- Each item has `slot`, `mediaType`, `mediaSource`, `mediaSourceId`, `entityId`, `tmdbId`, `title`, `posterPath`, `releaseYear`

## Feed item (`recent`, `activity`)

Both endpoints return `FeedItem[]`.

```json
{
  "id": "activity-id",
  "type": "review",
  "kind": "review",
  "createdAt": "2026-01-10T12:00:00.000Z",
  "actor": {
    "id": "user-id",
    "username": "your_username",
    "displayUsername": null,
    "image": null,
    "avatarUrl": null
  },
  "movie": null,
  "post": null,
  "review": null,
  "metadata": {
    "action": null,
    "excerpt": null,
    "targetUsername": null,
    "rating": null,
    "rewatch": null,
    "hasReview": null,
    "mediaType": null,
    "containsSpoilers": null,
    "reviewId": null,
    "commentId": null,
    "movieId": null,
    "postId": null,
    "postMediaId": null,
    "postMediaType": null,
    "seasonNumber": null,
    "episodeNumber": null
  },
  "engagement": {
    "likeCount": 0,
    "commentCount": 0,
    "viewerHasLiked": null
  }
}
```

### Feed item notes

- `viewerHasLiked` is currently `null` in public feed responses (no viewer context is passed).
- Depending on activity type, `movie`, `post`, or `review` can be `null`.
- `kind` may be a derived value (for example `liked_comment`, `liked_post`, `commented_post`).
- `seasonNumber` and `episodeNumber` are populated for season/episode interactions (`liked_movie`, `review`). Both are `null` for movie/series-level activities.
- For `liked_movie` activities on seasons/episodes, `metadata.rating` will be non-null when the action was a rating (not a like); `metadata.rating` is `null` for pure like actions.

## Review row (`/reviews`)

Key fields:

- `id`, `content`, `containsSpoilers`, `createdAt`, `updatedAt`
- media fields: `tmdbId`, `title`, `posterPath`, `releaseYear`, `mediaType`
- score field: `rating` (0.5–10, or `null`)

## Interaction rows (`/likes`, `/watchlist`)

Key fields:

- `tmdbId`, `title`, `posterPath`, `releaseYear`
- `runtime`, `genres`, `mediaType`
- `lastInteractionAt`

## List row (`/lists`)

Key fields:

- list fields: `id`, `title`, `description`, `isRanked`, `createdAt`, `updatedAt`, `itemCount`
- `items[]` entries: `position`, `note`, `tmdbId`, `title`, `posterPath`, `releaseYear`

## Diary row (`/diary`)

Key fields:

- diary fields: `id`, `mediaType`, `watchedDate`, `rewatch`, `createdAt`, `updatedAt`
- rating: `rating` (0.5–10, or `null`)
- `media` object (`tmdbId`, `title`, `posterPath`, `releaseYear`)
- optional `review` object (`id`, `content`, `containsSpoilers`, `createdAt`) or `null`

## Serials Progress payload (`/serials/:tmdbId`)

Key fields:

- `series` basic info: `id`, `tmdbId`, `title`, `posterPath`, `numberOfSeasons`, `numberOfEpisodes`
- `viewerTracking` progress:
  - `watchedEpisodesCount`: total count of watched episodes.
  - `watchedEpisodes[]` list: `{ seasonNumber, episodeNumber }` mappings.
  - `currentEpisode` (Up Next): `{ seasonNumber, episodeNumber, name }` or `null` if series completed.
  - interaction aggregations: `ratingsCount`, `likesCount`, `reviewsCount`.
- `seasons[]` array list: `seasonNumber`, `name`, `episodeCount`, and season-level `viewerInteraction` object (`watched`, `liked`, `rating`, `hasReview`).

## Currently Watching payload (`/serials/currently-watching`)

An array of in-progress series, most recently watched first. Key fields per item:

- series info: `tmdbId`, `title`, `posterPath`, `backdropPath`, `firstAirYear`, `numberOfSeasons`, `numberOfEpisodes`
- progress: `watchedEpisodesCount`, `progressPercent` (0–100, rounded)
- `lastWatchedAt`: timestamp of the most recently watched episode.
- `currentEpisode` (Up Next): `{ seasonNumber, episodeNumber, name }`, or `null` if the cached episode total is behind TMDB's true count.
