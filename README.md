# This is Cinema

A personal social film diary — Letterboxd meets Twitter. Built to power my portfolio's "recently watched" feed via a public API, and for daily use with friends.

**Live:** [arkheion.gorkemkaryol.dev](https://arkheion.gorkemkaryol.dev)

## Stack

| Layer | Tech |
|---|---|
| Runtime | Bun |
| Backend | Express v5 |
| Database | Neon (Serverless Postgres) |
| ORM | Drizzle |
| Auth | Better Auth |
| Frontend | React + Vite |
| Routing | TanStack Router (file-based) |
| Data fetching | TanStack Query |
| Styling | Tailwind CSS |
| Deploy | Cloudflare Pages (frontend) + Render (backend) |
| External API | TMDB (on-demand cache — never bulk imported) |

## Roadmap

### Phase 1 — Core MVP ✅
Auth, film search, diary logging, user profiles, public API for portfolio.

### Phase 2 — Social Layer 🔄
Reviews, comments, likes, follow graph, activity feed.

### Phase 3 — Organization
Lists (ranked/unranked), tags (`#rewatch`, `#horror`, etc.).

### Phase 4 — Stats + Admin
Watch time, top directors/actors, heatmap, admin moderation panel.

## Current Status

### Backend
- `POST /api/auth/*` — Better Auth (sign-up, sign-in, session)
- `GET /api/movies/search` — TMDB search proxy
- `GET /api/movies/:tmdbId` — movie detail with on-demand DB caching
- `GET /api/movies/recent` — recently cached/logged films
- `GET /api/movies/:tmdbId/logs` — log count for a film
- `GET|POST|PUT|DELETE /api/diary` — diary CRUD, optional review payload on log
- `GET /api/users/:username` — public profile
- `GET /api/users/:username/diary` — public diary
- `GET|PUT /api/users/me` — own profile + settings
- `POST /api/auth/update-user` — username/name update (Better Auth)
- Phase 2 modules (`/api/reviews`, `/api/social`, `/api/interactions`) in progress

### Frontend
- File-based routing with TanStack Router
- Auth pages (sign-in / sign-up)
- Films page with autocomplete search + recent section
- Movie detail page
- Log film modal (date, rating, rewatch flag)
- Profile page + settings page
- Sidebar navigation + page transitions

## Local Development

### Backend
```bash
cd backend
bun install
bun dev
```

### Frontend
```bash
cd frontend
bun install
bun dev
```

### Environment Variables

**Backend** (`backend/.env`):
```
DATABASE_URL=
BETTER_AUTH_SECRET=
TMDB_ACCESS_TOKEN=
CORS_ORIGIN=http://localhost:5173
PORT=5000
```

**Frontend** (`frontend/.env`):
```
VITE_API_PROXY_TARGET=http://localhost:5000   # dev proxy target
VITE_API_BASE_URL=                            # empty in dev, set in production
```

See `frontend/.env.example` for reference.

## Architecture Notes

- **Domain-driven module structure** — each feature (`movies`, `diary`, `reviews`, etc.) owns its entity, service, controller, and routes.
- **On-demand TMDB caching** — films are fetched from TMDB and cached in Neon only when first touched by a user. No bulk imports, no API waste.
- **Activities table** — every user action writes a denormalized row to `activities`. The feed is a single JOIN on `follows`, no complex unions.
- **Diary ≠ Review** — `diary_entries` (multiple per film, watch log) and `reviews` (one per film, text) are separate tables by design.
- **Profiles table** — extends Better Auth's `user` table with app metadata (`bio`, `top4MovieIds`, `isAdmin`). Auto-created via Better Auth after-signup hook.
