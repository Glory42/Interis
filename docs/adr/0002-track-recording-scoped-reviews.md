# Track reviews are scoped to the MusicBrainz Recording, not a specific Release

**Status:** accepted

`Album` in this app is one row per MusicBrainz release-group — the abstract idea of an album, independent of edition. A release-group has no tracklist of its own; the concrete tracklist lives on a `release` (what we call an `Edition`), and different Editions of the same Album can have different tracklists (bonus tracks, remasters). MusicBrainz also has a third layer, the `recording` (what we call a `Track`) — the actual performance/take, shared across every Edition it appears on, and even across different Albums (e.g. a studio album and a Greatest Hits compilation carrying the same recording).

**Decision:** a `Track`'s identity and review pool is scoped to the MusicBrainz recording, not to any specific Edition. Reviewing/rating/liking/logging a Track is one action, one review pool, regardless of which Edition or Album a user found it through. An `Album`'s Track list is the *union* of every distinct Track across all of its Editions, deduplicated — not any single Edition's tracklist — so a deluxe edition's bonus tracks are part of the Album without requiring us to pick one "canonical" Edition and lose the rest.

**Considered Options:**
- **Release-scoped tracks** — each Edition's copy of a track is a separately reviewable row. Rejected: fragments reviews/ratings for what a user experiences as the same song, and complicates search/feed ("which of these 4 copies do I review?"). More "accurate" to a specific pressing, but that accuracy isn't what a review app needs — matches why a Movie review isn't split by which physical disc someone watched.
- **Pick one canonical Edition, ignore the rest** — simpler, but Editions became a first-class browsable feature (sorted by popularity) specifically so bonus/exclusive tracks on other editions aren't invisible; picking one Edition and discarding the others would silently drop real tracks from the Album.

**Consequences:** a remaster that MusicBrainz assigns a new recording MBID to (a real, known MusicBrainz data quirk) will appear as a distinct Track with its own empty review history, separate from the original recording's reviews — this is a limitation of the source data, not something this app's model can paper over.
