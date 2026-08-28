# Interis

A social movie/TV/music/book journal (Letterboxd-inspired). Users log watches/listens/reads, write reviews, follow each other, and browse per-media archives.

## Language

### Media hierarchy

**Series**:
A TV show. Composed of `Season`s, each composed of `Episode`s. Independently reviewable/loggable at the Series, Season, and Episode level.

**Album**:
A musical work — one row per MusicBrainz release-group (the abstract "idea" of the album, independent of edition). Its `Track`s are the *union* of every distinct Track that appears on any of its `Edition`s, deduplicated — not any single edition's tracklist. Independently reviewable/loggable at the Album level (one review pool regardless of which Edition a user encountered it through). Has a "currently listening" progress rollup computed from its Tracks' logged state, mirroring Series' "currently watching."
_Avoid_: Record, LP (implies a physical format; Album is format-agnostic here)

**Edition**:
One specific pressing/release of an `Album` — one row per MusicBrainz release (e.g. "OK Computer — UK CD, 1997" vs "OK Computer — Collector's Edition, 2009"). Shows which ordered subset of the Album's Track union it contains (an Edition-exclusive bonus track simply adds a new Track to that union). Not independently reviewable; exists so users can browse an Album's different releases, sorted by popularity. Maps to MusicBrainz's "release".
_Avoid_: Release (avoid the bare MusicBrainz term in user-facing/domain language — reserve "release" for talking about the MusicBrainz API itself)

**Track**:
An individual song, independently reviewable/loggable/searchable — the same review pool no matter which `Edition` or `Album` it's encountered through (the same Track can belong to more than one Album's union, e.g. a studio album and a Greatest Hits compilation). Track is to Album what `Episode` is to `Season`, except a Track's identity is edition- and album-independent. Has full parity with Episode's capability set: liked, rated, reviewed, and logged with a dated "listened on" entry. Maps 1:1 to a MusicBrainz "recording".
_Avoid_: Song (colloquial synonym, not the canonical term — use Track in code/schema/UI); Recording (reserve for talking about the MusicBrainz API itself)

**Book**:
A published book. Has no independently-reviewable sub-unit (no chapter-level reviewing) — reviewing is at the Book level only.
