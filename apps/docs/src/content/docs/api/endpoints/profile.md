---
title: Profile
description: Read a user's public profile summary and aggregate stats.
---

## Endpoint

```txt
GET /api/public/:username/profile
```

Returns core profile fields and high-level counts used by widgets and profile cards.

## Path params

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | yes | Interis username to resolve |

## Query params

None.

## Response

```json
{
  "username": "your_username",
  "displayUsername": "Your Username",
  "name": "Your Name",
  "avatarUrl": null,
  "bio": "Public bio",
  "location": "Istanbul",
  "favoriteGenres": ["Drama", "Thriller"],
  "themeId": "rose-pine",
  "createdAt": "2026-01-01T12:00:00.000Z",
  "stats": {
    "movieEntryCount": 120,
    "serialEntryCount": 30,
    "reviewCount": 42,
    "movieCount": 95,
    "listCount": 8,
    "followerCount": 15,
    "followingCount": 21
  }
}
```

### Notes

- Timestamps are serialized as ISO datetime strings.
- `favoriteGenres` is an array (falls back to `[]` when missing).
- `themeId` is one of `rose-pine`, `null-log`, `nitrate`, `marquee`.
- `movieEntryCount` / `serialEntryCount` count film and TV diary logs separately.
- `reviewCount` counts all of the user's reviews (film and TV).
- `movieCount` counts distinct films the user has logged or marked watched.
- `listCount` counts public lists only.

## Empty state behavior

No array-style empty state. For existing users, this endpoint returns an object.

## Error behavior

- `404` with `{ "error": { "message": "User not found", "code": "NOT_FOUND" } }` when username does not exist.
- `429` when the public rate limit is exceeded.
- `500` for unexpected server errors.

## Examples

### fetch

```js
const username = 'your_username';
const res = await fetch(`https://api.interis.gorkemkaryol.dev/api/public/${username}/profile`);

if (!res.ok) throw new Error(`Profile request failed: ${res.status}`);

const profile = await res.json();
console.log(profile.displayUsername ?? profile.username);
```

### cURL

```bash
curl "https://api.interis.gorkemkaryol.dev/api/public/your_username/profile"
```

### Practical: render a compact profile header

```js
function toProfileHeader(profile) {
  return {
    title: profile.displayUsername ?? profile.username,
    subtitle: `${profile.stats.reviewCount} reviews · ${profile.stats.movieEntryCount + profile.stats.serialEntryCount} logs`,
    themeId: profile.themeId,
  };
}
```

Next: [Top 4 endpoint](/api/endpoints/top4/)
