# Frontend (Web app)

React + Vite frontend for Interis.

## What this app includes

- Guest landing, home feed, diary, and profile experiences
- Films archive and film detail pages
- TV archive, series detail, and per-season pages
- Director and actor pages, ⌘K search, lists, and review detail pages
- Auth flows (sign in, join, recover, recovery question) with session cookies
- Settings pages (profile, account & security, favorites, genres, theme, blocked, data, delete account)
- Admin console and developer page
- Feature-driven UI architecture with TanStack Router + Query

## Stack

| Layer | Tech |
| --- | --- |
| Framework | React 19 |
| Build | Vite 7 |
| Routing | TanStack Router (file-based) |
| Data | TanStack React Query |
| Styling | Tailwind CSS 4 |
| UI | shadcn-style primitives (Radix Slot, CVA) |
| Icons | Lucide |
| Validation | Zod |
| Auth | In-house JWT access + refresh cookies, sent by `apiRequest` |

## Getting started

```bash
cd apps/web
bun install
bun run dev
```

By default, Vite runs on `http://localhost:5173` and proxies `/api` to the backend.

## Environment variables

Create `apps/web/.env`:

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

- Test runner: Vitest (`jsdom`, via `tests/support/environments/jsdom-native-fetch.ts`)
- UI testing: React Testing Library
- Network mocking: MSW (`tests/support/msw/*`)
- Shared setup: `tests/support/setup.ts`

Run tests:

```bash
cd apps/web
bun run test
```

## Route map

| Route | Description |
| --- | --- |
| `/` | Home feed (signed in) or guest landing |
| `/movies` | Films archive |
| `/movies/:tmdbId` | Film detail |
| `/serials` | TV archive |
| `/serials/:tmdbId` | Series detail |
| `/serials/:tmdbId/season/:seasonNumber` | Season page (phones) |
| `/director/:slug` | Director page |
| `/actor/:slug` | Actor page |
| `/reviews/:username/:reviewId` | Review detail |
| `/profile/:username/*` | Profile tabs (overview, diary, reviews, liked, watching, watchlist, stats, lists) |
| `/settings/*` | Profile, auth, favorites, genres, theme, blocked, data, delete-account |
| `/login`, `/register`, `/forgot-password` | Auth |
| `/setup-security-question` | Recovery question setup |
| `/developer` | Public API terms and widget snippets |
| `/admin/*` | Admin console (overview, reports, users, content, audit, cache) |

## Project structure

```text
apps/web/
├── components.json
├── vite.config.ts
├── vitest.config.ts
├── tests/                     # Vitest + RTL + MSW suites and helpers
└── src/
    ├── main.tsx                  # app bootstrap, router + query providers
    ├── routeTree.gen.ts          # generated TanStack Router tree
    ├── routes/                   # file-based route definitions
    ├── features/                 # domain features (api + hooks + components)
    ├── components/               # shared ui/, layout/ and film/ (slate, poster card, rockets) components
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
├── api.ts           # Feature API (requests + Zod schemas)
├── api/             # Larger features only (films, tv): requests/schemas/mappers/types behind the api.ts barrel
├── hooks/           # React Query hooks + query key factories
├── components/      # Feature-specific UI components
├── pages/           # Page-level components (when needed)
└── types.ts         # Local type definitions (when needed)
```

| Feature | Purpose |
| --- | --- |
| `admin/` | Admin console (overview, reports, users, content, audit log, cache) |
| `auth/` | Authentication, sign-in/join/recover forms, useAuth hook |
| `data-transfer/` | Export and import of your data |
| `developer/` | Developer page for the public API |
| `diary/` | Log and review dialog, diary entry CRUD |
| `feed/` | Home feed (grouped day cards, Now showing / Your week rail, composer) |
| `films/` | Films archive and detail, FilmCard |
| `interactions/` | Like/watchlist/rating interactions |
| `landing/` | Guest landing page |
| `lists/` | User-curated lists |
| `media/` | Shared film/TV archive + detail UI (`MediaArchivePage`, `MediaActionsSidebar`, `MediaDetailsMainSection`, ...) |
| `moderation/` | Block and mute |
| `notifications/` | Notifications bell |
| `people/` | Director/actor pages |
| `posts/` | Short posts |
| `profile/` | User profiles with tabs |
| `reports/` | Reporting content |
| `reviews/` | Review display and detail |
| `search/` | ⌘K search and recent searches |
| `settings/` | Settings pages |
| `social/` | Follow graph |
| `theme/` | Theme system (rose-pine, null-log, nitrate, marquee) |
| `tv/` | TV archive, series detail, seasons and episodes |
| `uploads/` | Avatar uploads |
| `viewer-status/` | Batched watched/liked/rating marks for poster cards |

## Data flow conventions

- **API functions** are exposed from `src/features/*/api.ts` (implemented in `api/requests.ts` for films and tv) with Zod-validated schemas.
- **Data fetching hooks** live under feature hooks (`src/features/*/hooks/*`) using TanStack Query.
- **Query key factories** are exported as `*Keys` objects (e.g., `filmKeys`, `seriesKeys`, `authKeys`, `feedKeys`) for consistent cache key management.
- **Requests include cookies** (`credentials: include`) for authenticated endpoints.
- **Smart retry**: Queries do NOT retry on 400, 401, 403, 404, 408, 422; other errors retry once. Mutations never retry.
- **Freshness**: queries stay fresh for 2 minutes and don't refetch on window focus or reconnect; there is no polling.
- **Architecture linting**: ESLint caps files at 330 lines and stops `api.ts`/`api/` modules importing routes, components or pages.

## Routing patterns

- **Auth guards**: `beforeLoad` hooks with `requireAuthenticatedUser` / `requireGuestUser` / `requireAdminUser`.
- **Param validation**: `beforeLoad` validates route params (positive int, slug format) with redirects on failure.
- **Data prefetching**: `loader` functions use `queryClient.prefetchQuery` for route-driven data loading.
- **Route error boundaries**: Major routes define `errorComponent` boundaries for resilient failures.
- **Route matching for active state**: Active tab/nav state derives from route matching APIs, not pathname string parsing.
- **Safe redirects**: `getSafeRedirectPath()` prevents open redirect attacks.

## Notes

- In local dev, keep `VITE_API_BASE_URL` empty so `/api` calls go through Vite proxy.
- If routes change, run `bun run routes:generate` (also included in build/typecheck scripts).
- Supported themes: rose-pine, null-log, nitrate, marquee.
