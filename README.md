# This is Cinema

Cinema social diary platform inspired by Letterboxd-style workflows.

- Live link: `https://cinema.gorkemkaryol.dev`
- Stack: Bun + Express + Drizzle + Neon + Better Auth + TanStack Router/Query + Tailwind

## Roadmap (Master Plan)

### Phase 1 — Core MVP (Auth + Film Logging)
Goal: users can sign in, search films, open details, and log watched entries.

### Phase 2 — Social Layer (Reviews + Feed + Follow)
Goal: social activity flow, review/comment interactions, follow graph, and feed.

### Phase 3 — Organization (Lists + Tags)
Goal: list creation/ordering and tagging for deeper catalog organization.

### Phase 4 — Stats + Admin
Goal: advanced analytics, moderation/admin panel, polish and optimization.

## Current Status (Where We Are)

### Backend
- Phase 1 endpoints are implemented and active (`/api/auth`, `/api/movies`, `/api/diary`, `/api/users`).
- Added movie extras for frontend UX:
  - `GET /api/movies/recent`
  - `GET /api/movies/:tmdbId/logs`
- Diary creation supports optional review payload on log.

### Frontend
- TanStack Router file-based structure is in place.
- Auth pages, films flow, movie detail, and log modal are implemented.
- Films page has autocomplete suggestions and recent-cinema section.
- Profile and settings pages are implemented with strict typed data flow.
- Sidebar navigation, transitions, and UX polish are implemented.

### Overall
- Core product flow is beyond baseline Phase 1 on UI/UX.
- Phase 2 backend social APIs (full follow/feed/reviews modules) are still in progress for complete rollout.

## Local Development

### 1) Backend
```bash
cd backend
bun install
bun dev
```

### 2) Frontend
```bash
cd frontend
bun install
bun dev
```

## Environment Notes

Frontend uses two API-related env vars:

- `VITE_API_PROXY_TARGET`: dev-only Vite proxy target (usually `http://localhost:5000`)
- `VITE_API_BASE_URL`: browser request base URL (typically empty in dev, set in production if API is cross-origin)

Use `frontend/.env.example` as reference.
