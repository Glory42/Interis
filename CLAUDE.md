# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Interis is a social movie journal app (Letterboxd-inspired). Users log watches, write reviews, follow each other, browse a cinema/serial archive, and maintain public profiles with lists, likes, and watchlists. External widgets are served via a public API (`/api/public/*`).

## Commands

### Backend (run from `apps/api/`)
```bash
bun run dev          # watch mode dev server (port 5000)
bun run typecheck    # tsc --noEmit
bun test             # all tests
bun run test:integration   # integration tests only
bun run lint:arch    # architecture layer check (see constraints below)
bunx drizzle-kit generate  # generate migration after schema change
bunx drizzle-kit migrate   # apply migrations
bun run test:db:reset      # reset test DB
```

### Frontend (run from `apps/web/`)
```bash
bun run dev          # Vite dev server (port 5173, proxies /api to :5000)
bun run typecheck    # tsr generate + tsc -b
bun run lint         # ESLint
bun run test         # Vitest run
bun run build        # tsr generate + tsc -b + vite build
bun run routes:generate  # regenerate TanStack Router route tree (required after adding/renaming routes)
```

### E2E (run from `apps/e2e/`)
```bash
bun run test:smoke   # Playwright smoke tests
```

## Environment

`apps/api/.env`:
```
DATABASE_URL=
BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SECRET=
TMDB_ACCESS_TOKEN=Bearer <token>
CORS_ORIGIN=http://localhost:5173
PORT=5000
# Optional: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
```

`apps/web/.env`:
```
VITE_API_PROXY_TARGET=http://localhost:5000
VITE_API_BASE_URL=
```

## Architecture

### Request flow
```
Browser → Vite dev server (proxies /api) → Express (port 5000)
                                                 ↓
                                          Better Auth (cookie sessions)
                                                 ↓
                                   controller → service → repository
                                                 ↓
                                         Drizzle ORM → Neon PostgreSQL
                                                 ↓
                                       TMDB API (on-demand + cached locally)
```

### Backend module structure

Every domain under `src/modules/<module>/` follows this exact layout:

```
<module>.routes.ts      # Express Router — wraps handlers with asyncHandler()
<module>.controller.ts  # Static class — HTTP in/out, input validation, calls service only
<module>.service.ts     # Static facade — delegates to sub-services
<module>.entity.ts      # Drizzle pgTable definition
dto/                    # Zod schemas for request params/body/query
repositories/           # Static classes — direct Drizzle queries, no business logic
services/               # Business logic sub-services (often split read/write)
helpers/                # Pure utility functions
types/                  # Local TypeScript types
constants/              # Magic values / enums
```

**Layer rules enforced by `bun run lint:arch`:**
- Controllers must not import repositories directly (must go through service)
- Repositories must not import services or controllers
- Services must not import controllers
- DTOs must not import services, repositories, or controllers
- No single module file over 380 lines

**Auth:** `requireAuth` middleware attaches `req.user` (full user object). For optional auth use `resolveViewerUserIdFromHeaders()` from `commons/auth`. Admin-only routes use `requireAdmin`.

**Error handling:** wrap all route handlers with `asyncHandler()`. Use `sendBadRequest()` for validation failures. Global error handler in `src/index.ts` catches thrown errors.

**Database entities** are exported in FK-dependency order from `src/infrastructure/database/entities.ts` — add new entities there in the correct position. The `drizzle.config.ts` points at this single file as the schema source.

**TMDB:** movie/serial data is fetched on demand and cached locally in the DB — never bulk imported. Always use the TMDB client from `infrastructure/tmdb`.

**Activity feed:** creating lists, following users, logging diary entries, and other social actions produce rows in the `activities` table (see `social.entity.ts` for the `activityTypeEnum`).

### Frontend structure

```
src/
├── routes/                     # TanStack Router file-based routes
│   └── profile/$username/      # Profile sub-routes (diary, reviews, lists, liked, watchlist)
├── features/<feature>/
│   ├── api.ts                  # fetch calls — use apiRequest(), validate with Zod
│   ├── hooks/use<Feature>.ts   # React Query hooks + query key factories
│   ├── components/             # Feature-scoped UI
│   └── pages/                  # Page-level components wired to routes
├── components/ui/              # Shared Radix/shadcn primitives
├── lib/
│   ├── api-client.ts           # apiRequest<T>() — handles auth cookies, timeouts, error parsing
│   ├── query-client.ts         # QueryClient config
│   └── router/auth-guards.ts   # requireAuthenticatedUser / requireGuestUser / requireAdminUser
└── types/api.ts                # Shared Zod schemas + inferred TS types
```

**Routing:** file-based with TanStack Router. Always run `bun run routes:generate` after adding/renaming route files. Use `beforeLoad` for auth guards, `loader` for prefetch, `validateSearch` for query params.

**API calls:** use `apiRequest<TResponse>()` from `@/lib/api-client`, not raw `fetch`. Validate responses with Zod. Credentials (cookies) are included automatically.

**Query keys:** export a `<feature>Keys` factory object from each hooks file. Invalidate by key prefix on mutations.

**Modals:** use the project's custom modal pattern (not Radix Dialog) — controlled `isOpen` boolean, backdrop `div` with `theme-modal-overlay fixed inset-0 z-140 bg-background/70 backdrop-blur-sm`, content in `theme-modal-panel` with `animate-fade-up`. See `FeedReviewEditDialog.tsx` as reference.

**Styling:** Tailwind CSS v4. Use `cn()` from `@/lib/utils` for conditional classes. Adhere to the theme token system — use `profile-shell-*`, `text-muted-foreground`, `text-foreground`, `border-border/*` etc. rather than hardcoded colors.

## Key domain notes

- **Diary entries and reviews are separate models.** A diary entry (watch log) can optionally have a review; reviews can also exist standalone.
- **The existing `lists` entity** (`apps/api/src/modules/lists/lists.entity.ts`) currently only supports movies (`movieId` FK). The frontend stubs (`features/lists/api.ts`, `features/profile/pages/ProfileListsPage.tsx`) are placeholders awaiting full implementation.
- **Serial support:** TV series are `tvSeries` in the DB (`tv_series` table), accessed via `src/modules/serials/`.
- **Interactions** (liked, watchlisted, rating) are stored in `movie_interaction` table — one row per user+movie pair, updated in place.
- **Theme system:** themes are full-stack — backend validates `themeId`, frontend loads from `public/theme-registry.js` before React hydrates. See `ADDING-THEMES.md` for the complete guide.
- **Public API** (`/api/public/*`) uses open CORS and is intended for external widgets — keep these routes read-only and unauthenticated.

## Adding a new backend module

1. Create `src/modules/<module>/` with entity, routes, controller, service, repository, dto files.
2. Export the entity from `src/infrastructure/database/entities.ts` in FK order.
3. Run `bunx drizzle-kit generate && bunx drizzle-kit migrate`.
4. Register the router in `src/index.ts`.
5. Run `bun run lint:arch` to verify layer boundaries.

## Adding a new frontend feature

1. Create `src/features/<feature>/` with `api.ts` and `hooks/`.
2. Add route file(s) under `src/routes/`.
3. Run `bun run routes:generate`.
4. Add Zod schemas to `src/types/api.ts` if the type is shared across features.
