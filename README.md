# [Interis](https://interis.gorkemkaryol.dev)

A social movie journal app inspired by Letterboxd + timeline-style social apps.

- Log watches with dates, ratings, rewatches, and optional reviews
- Follow people and browse a personalized activity feed
- Browse a cinema archive with genre/language/time/sort filters
- Explore public profile pages, stats, lists, likes, and watchlists
- Power external widgets through a small public API (`https://api.interis.gorkemkaryol.dev/api/public/*`)


## Tech stack

| Layer | Tech |
| --- | --- |
| Runtime | Bun |
| Backend | Express 5 + TypeScript |
| Database | Neon (PostgreSQL) |
| ORM | Drizzle ORM |
| Auth | In-house (JWT access + rotating refresh tokens, argon2id via `Bun.password`) |
| Frontend | React 19 + Vite |
| Routing | TanStack Router (file-based) |
| Data | TanStack Query |
| UI | Tailwind CSS + Radix/shadcn primitives |
| External data | TMDB (on-demand fetch + local cache) |
| Storage | Cloudflare R2 (avatars) |

## Repository layout

```text
.
├── apps/api/          # Express API, domain modules, Drizzle schema/migrations
├── apps/docs/             # Astro + Starlight docs site for public API
├── apps/web/         # React app (TanStack Router + Query)
├── apps/e2e/              # Playwright smoke and end-to-end tests
├── CONTRIBUTING.md   # Guidelines for contributors
└── README.md
```

## Quick start

### Option A: Docker Compose (fastest, zero manual setup)

Prerequisites: Docker + Docker Compose.

```bash
docker compose up
```

This starts a local Postgres database, migrates it automatically, and boots
both the API (`http://localhost:5000`) and the frontend
(`http://localhost:5173`). No `.env` files are required — copy
[`.env.example`](.env.example) to `.env` at the repo root first if you want
real TMDB data (otherwise TMDB-backed endpoints return errors, everything
else works). See [`docker-compose.yml`](docker-compose.yml) for the exact
service topology.

### Option B: Manual (per-app)

Prerequisites:
- Bun 1.3+
- PostgreSQL (Neon recommended)
- TMDB API access token

1) Configure backend env (`apps/api/.env`)

```env
DATABASE_URL=
JWT_ACCESS_SECRET=
TMDB_ACCESS_TOKEN=
CORS_ORIGIN=http://localhost:5173
PORT=5000

# Optional (required only for uploads)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

2) Configure frontend env (`apps/web/.env`)

```env
VITE_API_PROXY_TARGET=http://localhost:5000
VITE_API_BASE_URL=
```

3) Install and run

```bash
# terminal 1 - backend
cd apps/api
bun install
bun run dev

# terminal 2 - frontend
cd apps/web
bun install
bun run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` to backend on port `5000`.

Alternatively, run both from the repo root after installing each app's own
dependencies once (`bun run install:all`): `bun run dev` starts both
concurrently, or `bun run dev:api` / `bun run dev:web` individually. See the
root [`package.json`](package.json) for the full list of orchestration
scripts (`build`, `test`, `lint`, `typecheck`, `lint:arch`).

## Documentation site

This repository now includes a dedicated docs project in `docs/` for the Interis
public API (`https://api.interis.gorkemkaryol.dev/api/public/:username/*`).

- Stack: Astro + Starlight
- Intended host: `https://docs.interis.gorkemkaryol.dev`
- Public API base (production): `https://api.interis.gorkemkaryol.dev/api/public`
- Main reference entry: `docs/src/content/docs/api/overview.md`

Run docs locally:

```bash
cd apps/docs
bun install
bun run dev
```

Build docs:

```bash
cd apps/docs
bun run build
```

## Key API groups

| Prefix | Purpose |
| --- | --- |
| `POST /api/auth/*` | In-house auth (sign-up, sign-in, sign-out, update-user, password reset) |
| `GET /api/movies/*` | Search, detail, logs, archive, trending |
| `GET /api/serials/*` | TV series search, detail, archive |
| `GET /api/people/*` | Director/actor pages |
| `GET\|POST\|PUT\|DELETE /api/diary` | Private diary CRUD |
| `GET /api/users/*` | Profile, reviews, likes, watchlist |
| `GET\|POST\|PUT\|DELETE /api/reviews/*` | Reviews, comments, likes |
| `GET\|POST\|DELETE /api/posts/*` | Short posts, comments, likes |
| `GET\|POST\|DELETE /api/social/*` | Feed + follow graph |
| `GET\|PUT /api/interactions/:tmdbId` | Watchlist/like/log interaction state |
| `POST /api/uploads/*` | Signed upload flow (R2) |
| `GET /api/public/:username/*` | Widget-friendly public endpoints |

## Quality checks

Backend:

```bash
cd apps/api
bunx tsc --noEmit
bun test
```

Frontend:

```bash
cd apps/web
bun run test
bun run typecheck
bun run lint
bun run build
```

E2E smoke (optional package):

```bash
cd apps/e2e
bun install
bun run test:smoke
```

CI note: GitHub Actions runs backend typecheck/lint/architecture checks and
the full integration suite on every PR, using the `DEVDATABASE_URL` secret
from the repo's `a` [environment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment) (a dedicated Neon database, kept separate from
the main `DATABASE_URL`/dev database since the suite performs real writes).

A pre-commit hook (Husky + lint-staged) runs ESLint on staged `apps/web` and
`apps/api` files automatically — installed via `bun install` at the repo
root (`prepare` script).

## Architecture notes

- **Feature-first backend**: Each domain owns controller/service/repository/dto/helpers/types. See [apps/api/README.md](apps/api/README.md) for details.
- **TMDB on-demand**: Movie data is fetched from TMDB on demand and cached locally; no bulk mirror/import.
- **Separate models**: Diary entries (watch logs) and reviews are modeled separately by design.
- **Read-optimized profiles**: Public profile routes are optimized for read-heavy usage and widget integration.
- **Route-driven frontend**: Frontend is route-driven and feature-oriented, with route-level error boundaries for major layouts.
- **API decomposition**: Film/serial frontend APIs are split into `api/{schemas,types,mappers,requests}` submodules behind stable feature barrels.
- **DTO normalization**: Backend query parsing is schema-first with explicit default/clamp normalization.
- **Architecture enforcement**: Frontend lint rules and backend `bun run lint:arch` checks prevent large monolith files, cross-layer imports, and reintroduction of removed transitional wrappers.
- **Performance-first**: scoped cache invalidation, paginated list endpoints, batched queries (no N+1), and cached external API reads are enforced conventions — see CONTRIBUTING.md's [Performance conventions](CONTRIBUTING.md#performance-conventions) and the `/performance-check` skill.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines, architecture overview, coding conventions, and how to get started.
