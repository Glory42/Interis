# Frontend (Web app)

React + Vite frontend for Interis.

## What this app includes

- Feed, diary, and profile experiences
- Cinema archive and movie detail pages
- TV series archive and detail pages
- Director and actor pages
- Auth flows (register/login) with session cookies
- Settings pages (profile, auth, theme)
- Feature-driven UI architecture with TanStack Router + Query

## Stack

| Layer | Tech |
| --- | --- |
| Framework | React 19 |
| Build | Vite 7 |
| Routing | TanStack Router (file-based) |
| Data | TanStack React Query |
| Styling | Tailwind CSS 4 |
| UI | Radix UI + shadcn-style primitives |
| Icons | Lucide |
| Validation | Zod |
| Auth | Better Auth client |

## Getting started

```bash
cd frontend
bun install
bun run dev
```

By default, Vite runs on `http://localhost:5173` and proxies `/api` to the backend.

## Environment variables

Create `frontend/.env`:

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
bun run test             # Vitest (run)
bun run test:watch       # Vitest watch mode
bun run test:coverage    # Vitest with coverage
```

## Testing

- Test runner: Vitest (`jsdom`)
- UI testing: React Testing Library
- Network mocking: MSW (`tests/support/msw/*`)
- Shared setup: `tests/support/setup.ts`

Run tests:

```bash
cd frontend
bun run test
```

## Route map

| Route | Description |
| --- | --- |
| `/` | Home/feed view |
| `/cinema` | Cinema archive |
| `/cinema/:tmdbId` | Movie detail |
| `/serials` | TV series archive |
| `/serials/:tmdbId` | TV series detail |
| `/director/:slug` | Director page |
| `/actor/:slug` | Actor page |
| `/profile/:username/*` | Profile tabs (overview, diary, reviews, films, likes, watchlist, lists) |
| `/settings/*` | Account/profile/theme settings |
| `/login`, `/register` | Auth |
| `/admin` | Admin section |

## Project structure

```text
frontend/
├── components.json
├── vite.config.ts
├── vitest.config.ts
├── tests/                     # Vitest + RTL + MSW suites and helpers
└── src/
    ├── main.tsx                  # app bootstrap, router + query providers
    ├── routeTree.gen.ts          # generated TanStack Router tree
    ├── routes/                   # file-based route definitions
    ├── features/                 # domain features (api + hooks + components)
    ├── components/               # shared app/layout/ui components
    ├── lib/
    │   ├── api-client.ts         # fetch wrapper + API error handling
    │   ├── query-client.ts       # TanStack Query client setup
    │   ├── router/               # auth guards, param parsers, safe redirects
    │   └── utils.ts              # shared utilities (cn)
    └── types/
        └── api.ts                # Zod schemas + inferred TS types for API contracts
```

## Feature organization

Each feature in `src/features/` follows a consistent structure:

```
feature/
├── api.ts           # Stable feature API barrel
├── api/             # API internals (requests/schemas/mappers/types)
│   ├── requests.ts
│   ├── schemas.ts
│   ├── mappers.ts
│   └── types.ts
├── hooks/           # React Query hooks + query key factories
├── components/      # Feature-specific UI components
├── pages/           # Page-level components (when needed)
└── types.ts         # Local type definitions
```

| Feature | Purpose |
| --- | --- |
| `admin/` | Admin panel |
| `auth/` | Authentication, login/register forms, useAuth hook |
| `diary/` | Diary entry CRUD |
| `feed/` | Home feed, trending, network stats |
| `films/` | Movie archive, detail, search, FilmCard, SpaceRating |
| `interactions/` | Like/watchlist interactions |
| `lists/` | User-curated lists |
| `people/` | Director/actor pages |
| `posts/` | Short posts |
| `profile/` | User profiles with tabs |
| `reviews/` | Review display |
| `serials/` | TV series |
| `settings/` | Settings pages |
| `social/` | Follow graph, feed |
| `theme/` | Theme system (rose-pine, null-log, gruvbox) |
| `uploads/` | Avatar uploads |

## Data flow conventions

- **API functions** are exposed from `src/features/*/api.ts` and implemented in `src/features/*/api/requests.ts` with Zod-validated schemas.
- **Data fetching hooks** live under feature hooks (`src/features/*/hooks/*`) using TanStack Query.
- **Query key factories** are exported as `*Keys` objects (e.g., `movieKeys`, `authKeys`, `feedKeys`) for consistent cache key management.
- **Requests include cookies** (`credentials: include`) for authenticated endpoints.
- **Smart retry**: Queries do NOT retry on 400, 401, 403, 404, 422; retry up to 2 times for other errors.
- **Architecture linting**: ESLint enforces file-size and API-layer import boundaries to prevent new monolith files and route/UI leakage into API modules.

## Routing patterns

- **Auth guards**: `beforeLoad` hooks with `requireAuthenticatedUser` / `requireGuestUser` / `requireAdminUser`.
- **Param validation**: `beforeLoad` validates route params (positive int, slug format) with redirects on failure.
- **Data prefetching**: `loader` functions use `queryClient.prefetchQuery` for route-driven data loading.
- **Route error boundaries**: Major routes define `errorComponent` boundaries for resilient failures.
- **Route matching for active state**: Active tab/nav state derives from route matching APIs, not pathname string parsing.
- **Legacy redirects**: `/films` routes redirect to `/cinema` for backward compatibility.
- **Safe redirects**: `getSafeRedirectPath()` prevents open redirect attacks.

## Notes

- In local dev, keep `VITE_API_BASE_URL` empty so `/api` calls go through Vite proxy.
- If routes change, run `bun run routes:generate` (also included in build/typecheck scripts).
- Supported themes: rose-pine, null-log, gruvbox.
