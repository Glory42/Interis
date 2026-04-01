# Frontend (Web app)

React + Vite frontend for Arkheion.

## What this app includes

- Feed, diary, and profile experiences
- Cinema archive and movie detail pages
- Auth flows (register/login) with session cookies
- Settings pages (profile, auth, theme)
- Feature-driven UI architecture with TanStack Router + Query

## Stack

- React 19
- Vite 7
- TanStack Router (file-based routes)
- TanStack Query
- Tailwind CSS 4
- Radix/shadcn-style primitives

## Getting started

```bash
cd frontend
bun install
bun run dev
```

By default, Vite runs on `http://localhost:5173`.

## Environment variables

Create `frontend/.env` (or copy from `frontend/.env.example`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_PROXY_TARGET` | dev only | Vite proxy target for `/api` (usually backend local URL) |
| `VITE_API_BASE_URL` | production usually | Absolute API base URL. Keep empty in local dev to use proxy |

## Scripts

```bash
bun run dev              # start Vite dev server
bun run routes:generate  # regenerate TanStack Router tree
bun run typecheck        # route generation + TypeScript build check
bun run lint             # ESLint
bun run build            # production build
bun run preview          # preview production build
```

## Route map (high-level)

- `/` - main home/feed view
- `/cinema` and `/cinema/$tmdbId` - archive + detail route set
- `/films` and `/films/$tmdbId` - film discovery/detail surface
- `/profile/$username/*` - profile tabs (overview, diary, reviews, films, likes, watchlist, lists)
- `/settings/*` - account/profile/theme settings
- `/login`, `/register` - auth
- `/admin` - admin section

## Project structure

```text
frontend/
├── components.json
├── vite.config.ts
└── src/
    ├── main.tsx                  # app bootstrap, router + query providers
    ├── routeTree.gen.ts          # generated TanStack Router tree
    ├── routes/                   # file-based route definitions
    ├── features/                 # domain features (feed, diary, films, profile, ...)
    ├── components/               # shared app/layout/ui components
    ├── lib/
    │   ├── api-client.ts         # fetch wrapper + API error handling
    │   ├── query-client.ts       # TanStack Query client setup
    │   └── utils.ts              # shared utilities
    └── index.css                 # Tailwind styles + design tokens
```

## Data flow conventions

- API functions live under each feature (`src/features/*/api.ts`) and validate responses with Zod.
- Data fetching hooks live under feature hooks (`src/features/*/hooks/*`) using TanStack Query.
- Requests include cookies (`credentials: include`) for authenticated endpoints.

## Notes

- In local dev, keep `VITE_API_BASE_URL` empty so `/api` calls go through Vite proxy.
- If routes change, run `bun run routes:generate` (also included in build/typecheck scripts).
