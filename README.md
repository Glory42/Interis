# Arkheion

Arkheion is a social movie journal app inspired by Letterboxd + timeline-style social apps.

- Log watches with dates, ratings, rewatches, and optional reviews
- Follow people and browse a personalized activity feed
- Browse a cinema archive with genre/language/time/sort filters
- Explore public profile pages, stats, heatmaps, lists, likes, and watchlists
- Power external widgets through a small public API (`/api/public/*`)

Live: [arkheion.gorkemkaryol.dev](https://arkheion.gorkemkaryol.dev)

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

## Repository layout

```text
.
├── backend/   # Express API, domain modules, Drizzle schema/migrations
├── frontend/  # React app (TanStack Router + Query)
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
# terminal 1
cd backend
bun install
bun run dev

# terminal 2
cd frontend
bun install
bun run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` to backend.

## Key API groups

- `POST /api/auth/*` - Better Auth endpoints (session, sign-in, sign-up, update-user)
- `GET /api/movies/*` - search, detail, logs, archive, trending
- `GET|POST|PUT|DELETE /api/diary` - private diary CRUD
- `GET /api/users/*` - profile, diary, reviews, films/cinema, likes, watchlist
- `GET|POST|PUT|DELETE /api/reviews/*` - reviews, comments, likes
- `GET|POST|DELETE /api/posts/*` - short posts, comments, likes
- `GET|POST|DELETE /api/social/*` - feed + follow graph
- `GET|PUT /api/interactions/:tmdbId` - watchlist/like/log interaction state
- `POST /api/uploads/*` - signed upload flow (R2)
- `GET /api/public/:username/*` - widget-friendly public endpoints

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

- Feature-first backend modules: each domain owns controller/service/repository/dto/helpers/types.
- TMDB data is fetched on demand and cached locally; no bulk mirror/import.
- Diary entries (watch logs) and reviews are modeled separately by design.
- Public profile/stats routes are optimized for read-heavy usage and widget integration.
- Frontend is route-driven and feature-oriented, with API contracts validated by Zod.
