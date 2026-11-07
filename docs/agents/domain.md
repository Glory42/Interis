# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — the glossary (User, Profile, Media, Film, Series, Interaction, …). This is a single-context repo; there is no `CONTEXT-MAP.md`.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in. Currently:
  - `0001-global-trending-on-interis.md` (superseded — the rail was removed; history only)
  - `0002-movie-as-canonical-naming-across-frontend-and-backend.md` (code-naming half superseded by 0003; the `/movies` URLs and `"movie"` values still stand)
  - `0003-films-and-tv-as-code-naming-wire-names-unchanged.md` — code says Film/Series/Tv (`modules/films`, `modules/tv`, `features/films`, `features/tv`, shared code in `media`); URLs, API paths, tables and JSON keep `movies`/`serials`

The `/domain-modeling` skill updates these as terms or decisions get resolved. Don't create new context files or ADRs upfront.

## File structure

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-global-trending-on-interis.md
│   ├── 0002-movie-as-canonical-naming-across-frontend-and-backend.md
│   └── 0003-films-and-tv-as-code-naming-wire-names-unchanged.md
└── apps/
    ├── api/
    └── web/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
