# Interis

Interis is a social film journal app. Users log watches, write reviews, follow each other, browse a catalog of Films and TV, curate lists, and maintain public profiles.

## Language

### Identity

**User**:
An Interis account — the identity record used for login, authorship, and following. Stored in the `user` table (name, email, username).
_Avoid_: account, member

**Profile**:
The mutable, user-facing side of a User: bio, location, avatar, favorite genres, theme, and admin/suspension status. One-to-one with User.
_Avoid_: account settings

### Media catalog

**Media**:
The umbrella term for "Film or Series" — used where logic, UI, or storage is genuinely shared between the two (e.g. Interaction, rating, archive browsing, detail-page layout, TMDB image urls). Lives in `modules/media`, `modules/media-interactions` and `features/media`; anything Films and TV both use goes there, not into one side.
_Avoid_: content, title (both too generic)

**Film**:
A film, TMDB-sourced and cached locally (title, release year, director, runtime, genres) the first time any user references it — never bulk-imported. The UI section is **Films**; code is `modules/films`, `features/films` and `Film*` names (ADR 0003). The wire keeps the older name: `/movies/:tmdbId` pages, `/api/movies`, the `movie` table, `movie_id` columns and `mediaType: "movie"`.
_Avoid_: movie (in new code and copy), cinema, title (title is ambiguous with the string field)

**Series**:
One TV show, TMDB-sourced and cached locally like Film (title, season/episode counts, network, status). The UI section is **TV**; code is `modules/tv` and `features/tv`, with `Series*` for one show and `Tv*` for the section or module (ADR 0003). The wire keeps the older name: `/serials/:tmdbId` pages, `/api/serials`, the `tv_series` table, `serial_*` columns and `mediaType: "tv"`.
_Avoid_: serial (in new code and copy), show in code names

**Person**:
A cast or crew member, TMDB-sourced and cached locally (name, known-for department, popularity). Content metadata, never an Interis account — distinct from User.
_Avoid_: actor, cast member (too narrow — Person covers crew too)

### Watching & reviewing

**Diary Entry**:
A record that a user watched a Film or Series on a given date — a watch log. Stored per media type (`diary_entry` for Films, `serial_diary_entry` for Series). May optionally have a Review attached (`Review.diaryEntryId` for Film logs, `Review.serialDiaryEntryId` for Series logs). Deleting the log keeps the Review, unattached.
_Avoid_: watch, log

**Review**:
A write-up about a Film or Series. May be attached to the Diary Entry it was written for, or stand alone with no Diary Entry at all.
_Avoid_: rating (a separate Interaction, not a Review)

**Comment**:
A reply to a Review or a Post — a distinct model per parent, not a shared one.
_Avoid_: reply

**Interaction**:
A user's standing relationship to one Film or Series — liked, watchlisted, watched, and rating — held as one row per user+media pair and updated in place, never a history of events (`movie_interaction` for Films, `serial_interaction` for Series). Season- and episode-level variants exist for Series.
_Avoid_: reaction, status

**Your Rating**:
A user's current rating of a Film or Series, on the 0.5–10 rocket scale: the Interaction rating, else their latest rated Diary Entry. Logging or editing their latest rated Diary Entry sets the Interaction rating to match.

**Community Rating**:
The average of every user's Your Rating for a Film or Series, one rating per user however many Diary Entries they have. The detail page and archive listings use the same rule.
_Avoid_: average log rating

### Lists

**List**:
A user-curated, orderable collection of Films and/or Series, optionally ranked and optionally public.
_Avoid_: watchlist (Watchlist is a boolean Interaction flag, not a List)

**List Entry**:
One Film or Series' membership in a List, carrying its position and an optional note.
_Avoid_: list item

### Social & activity

**Follow**:
A one-directional relationship where one user (the follower) subscribes to another (the followee). Not required to be reciprocal.
_Avoid_: friend, connection

**Activity**:
A record of one discrete user action — logging a Diary Entry, writing a Review, liking or watchlisting a Film/Series, following a user, creating a List, liking a Review, commenting, or posting. Stored as a row in the `activity` table (`type` enum) and is the raw material the Following Feed is built from.
_Avoid_: event, log entry (ambiguous with Diary Entry)

**Post**:
A short, Twitter-style standalone update a user writes, optionally attached to one Film or Series.
_Avoid_: status, tweet

**Following Feed**:
The personalized, authenticated activity stream showing Activities from the users the viewer follows (plus their own), scoped via the Follow relationship. Backs `GET /api/social/feed/following`.
_Avoid_: feed (too ambiguous alone — always qualify as "Following Feed" or "Trending Now")

**Trending Now**:
TMDB's industry-wide popularity ranking for Films and Series, fetched on demand and cached locally like any other TMDB data — carries no Interis user activity and is not personalized or Follow-scoped. Shown as two separate rankings, one for Films and one for TV, never blended into a single list.
_Avoid_: Trending on Interis (a superseded, Interis-engagement-based ranking that existed alongside this rail; removed — see [ADR 0001](docs/adr/0001-global-trending-on-interis.md))

### Moderation & trust

**Block**:
A relationship one user places on another that removes any Follow between them and hides each one's activity from the other's Following Feed.
_Avoid_: ban (a platform-wide restriction is Suspension, not Block)

**Mute**:
A one-directional relationship, distinct from Block, that hides another user's activity from the viewer's Following Feed without touching Follows or affecting the muted user.
_Avoid_: block (Mute and Block are separate relationships)

**Report**:
A user's flag of a Review, Post, comment, or List for moderator review, snapshotting the content at submit time so it stays reviewable even if the original is later edited or deleted.
_Avoid_: flag

**Suspension**:
An admin-applied, platform-wide restriction on a Profile (`isSuspended`) — distinct from Block/Mute, which are relationships between two ordinary users.
_Avoid_: ban, block

### Notifications

**Notification**:
A record that another user's action (follow, like, comment) or a moderator's removal of their content is relevant to a user and awaits their attention, with its own read/unread state. Distinct from Activity, which is the public record of the action itself regardless of who it's relevant to.
_Avoid_: alert
