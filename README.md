# Interis

A social movie journal app inspired by Letterboxd + timeline-style social apps.

- Log watches with dates, ratings, rewatches, and optional reviews
- Follow people and browse a personalized activity feed
- Browse a cinema archive with genre/language/time/sort filters
- Explore public profile pages, stats, lists, likes, and watchlists
- Power external widgets through a small public API (`/api/public/*`)

Live: [interis.gorkemkaryol.dev](https://interis.gorkemkaryol.dev)

## Tech stack

| Layer | Tech |
| --- | --- |
| Runtime | Bun |
| Backend | Express 5 + TypeScript |
| Database | Neon (PostgreSQL) |
| ORM | Drizzle ORM |
| Auth | Better Auth |
| Frontend | React 19 + Vite |
| Routing | TanStack Router (file-based) |
| Data | TanStack Query |
| UI | Tailwind CSS + Radix/shadcn primitives |
| External data | TMDB (on-demand fetch + local cache) |
| Storage | Cloudflare R2 (avatars) |

## Repository layout

```text
.
├── backend/          # Express API, domain modules, Drizzle schema/migrations
├── frontend/         # React app (TanStack Router + Query)
├── CONTRIBUTING.md   # Guidelines for contributors
└── README.md
```

## Quick start

Prerequisites:
- Bun 1.3+
- PostgreSQL (Neon recommended)
- TMDB API access token

1) Configure backend env (`backend/.env`)

```env
DATABASE_URL=
BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SECRET=
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

2) Configure frontend env (`frontend/.env`)

```env
VITE_API_PROXY_TARGET=http://localhost:5000
VITE_API_BASE_URL=
```

3) Install and run

```bash
# terminal 1 - backend
cd backend
bun install
bun run dev

# terminal 2 - frontend
cd frontend
bun install
bun run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` to backend on port `5000`.

## Key API groups

| Prefix | Purpose |
| --- | --- |
| `POST /api/auth/*` | Better Auth endpoints (session, sign-in, sign-up, update-user) |
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
cd backend
bunx tsc --noEmit
bun test
```

Frontend:

```bash
cd frontend
bun run typecheck
bun run lint
bun run build
```

## Architecture notes

- **Feature-first backend**: Each domain owns controller/service/repository/dto/helpers/types. See [backend/README.md](backend/README.md) for details.
- **TMDB on-demand**: Movie data is fetched from TMDB on demand and cached locally; no bulk mirror/import.
- **Separate models**: Diary entries (watch logs) and reviews are modeled separately by design.
- **Read-optimized profiles**: Public profile routes are optimized for read-heavy usage and widget integration.
- **Route-driven frontend**: Frontend is route-driven and feature-oriented, with API contracts validated by Zod. See [frontend/README.md](frontend/README.md) for details.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines, architecture overview, coding conventions, and how to get started.
