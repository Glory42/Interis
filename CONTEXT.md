# Interis

Interis is a social movie journal app. Users log watches, write reviews, follow each other, browse a movie/serial catalog, curate lists, and maintain public profiles.

## Language

### Identity

**User**:
An Interis account — the identity record used for login, authorship, and following. Stored in the `user` table (name, email, username).
_Avoid_: account, member

**Profile**:
The mutable, user-facing side of a User: bio, location, avatar, favorite genres, theme, and admin/suspension status. One-to-one with User.
_Avoid_: account settings

### Media catalog

**Movie**:
A film, TMDB-sourced and cached locally (title, release year, director, runtime, genres) the first time any user references it — never bulk-imported. The canonical term across the backend; the frontend's `films` feature directory and `/cinema/*` routes refer to the same concept under different names — a naming split worth resolving intentionally, not silently.
_Avoid_: film, cinema, title (title is ambiguous with the string field)

**Serial**:
A TV series, TMDB-sourced and cached locally like Movie (title, season/episode counts, network, status). Stored as `tv_series`, named "serial" consistently across backend, routes, and UI.
_Avoid_: TV series, show

**Person**:
A cast or crew member, TMDB-sourced and cached locally (name, known-for department, popularity). Content metadata, never an Interis account — distinct from User.
_Avoid_: actor, cast member (too narrow — Person covers crew too)

### Watching & reviewing

**Diary Entry**:
A record that a user watched a Movie or Serial on a given date — a watch log. Stored per media type (`diary_entry` for movies, `serial_diary_entry` for serials). May optionally have a Review attached (`Review.diaryEntryId`).
_Avoid_: watch, log

**Review**:
A write-up about a Movie or Serial. May be attached to the Diary Entry it was written for, or stand alone with no Diary Entry at all.
_Avoid_: rating (a separate Interaction, not a Review)

**Comment**:
A reply to a Review or a Post — a distinct model per parent, not a shared one.
_Avoid_: reply

**Interaction**:
A user's standing relationship to one Movie or Serial — liked, watchlisted, watched, and rating — held as one row per user+media pair and updated in place, never a history of events. Season- and episode-level variants exist for Serials.
_Avoid_: reaction, status

### Lists

**List**:
A user-curated, orderable collection of Movies and/or Serials, optionally ranked and optionally public.
_Avoid_: watchlist (Watchlist is a boolean Interaction flag, not a List)

**List Entry**:
One Movie or Serial's membership in a List, carrying its position and an optional note.
_Avoid_: list item

### Social & activity

**Follow**:
A one-directional relationship where one user (the follower) subscribes to another (the followee). Not required to be reciprocal.
_Avoid_: friend, connection

**Activity**:
A record of one discrete user action — logging a Diary Entry, writing a Review, liking or watchlisting a Movie/Serial, following a user, creating a List, liking a Review, commenting, or posting. Stored as a row in the `activity` table (`type` enum) and is the raw material both the Following Feed and Trending on Interis are built from.
_Avoid_: event, log entry (ambiguous with Diary Entry)

**Post**:
A short, Twitter-style standalone update a user writes, optionally attached to one Movie or Serial.
_Avoid_: status, tweet

**Following Feed**:
The personalized, authenticated activity stream showing Activities from the users the viewer follows (plus their own), scoped via the Follow relationship. Backs `GET /api/social/feed/following`.
_Avoid_: feed (too ambiguous alone — always qualify as "Following Feed" or "Trending on Interis")

**Trending on Interis**:
A global, unauthenticated ranking of Movies/Serials by how many distinct users engaged with them in the last 7 days, counting only `diary_entry`, `review`, `liked_movie`, and `watchlisted_movie` Activities (second-order engagement like liking or commenting on someone else's Review does not count, nor does creating a List or posting). Ranked by distinct-user count, not raw Activity count, so one user's repeat engagement with the same title doesn't inflate its ranking. Not scoped by the Follow relationship — every user sees the same ranking.
_Avoid_: Trending among users (the old, follow-scoped name for this same rail — superseded), Trending Now (a different, unrelated rail that mirrors TMDB's industry-wide trending data, with no Interis user activity involved at all)

### Moderation & trust

**Block**:
A one-directional relationship where a user hides another's content from their own Following Feed and related surfaces.
_Avoid_: ban (a platform-wide restriction is Suspension, not Block)

**Mute**:
A one-directional relationship, distinct from Block, that hides another user's activity from the viewer's Following Feed.
_Avoid_: block (Mute and Block are separate relationships)

**Report**:
A user's flag of a Review or Post for moderator review, snapshotting the content at submit time so it stays reviewable even if the original is later edited or deleted.
_Avoid_: flag

**Suspension**:
An admin-applied, platform-wide restriction on a Profile (`isSuspended`) — distinct from Block/Mute, which are relationships between two ordinary users.
_Avoid_: ban, block

### Notifications

**Notification**:
A record that another user's action (follow, like, comment) is relevant to a user and awaits their attention, with its own read/unread state. Distinct from Activity, which is the public record of the action itself regardless of who it's relevant to.
_Avoid_: alert
