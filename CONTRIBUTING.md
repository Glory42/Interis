# Contributing to Interis

Thank you for your interest in contributing to Interis. This document covers the project architecture, development workflow, coding conventions, and guidelines for submitting changes.

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). Found a security issue? Report it privately — see [SECURITY.md](SECURITY.md).

## Table of contents

- [Project overview](#project-overview)
- [Architecture](#architecture)
- [Development setup](#development-setup)
- [Database workflow](#database-workflow)
- [Coding conventions](#coding-conventions)
- [Backend conventions](#backend-conventions)
- [Frontend conventions](#frontend-conventions)
- [Performance conventions](#performance-conventions)
- [Adding a new feature](#adding-a-new-feature)
- [Testing](#testing)
- [Quality checks](#quality-checks)
- [Adding a custom theme](#adding-a-custom-theme)
- [Submitting changes](#submitting-changes)

## Project overview

Interis is a social film and TV diary. It is a Bun monorepo with four packages:

| Package | Purpose |
| --- | --- |
| `apps/api/` | Express 5 API running on Bun, with Drizzle ORM, in-house JWT auth, TMDB integration |
| `apps/web/` | React 19 SPA with TanStack Router + Query, Tailwind CSS v4 |
| `apps/docs/` | Astro (Starlight) documentation site |
| `apps/e2e/` | Playwright end-to-end tests |

The frontend proxies `/api` requests to the backend during development.

### Key capabilities

- Log film and TV watches with dates, 0.5–10 rocket ratings in half steps, rewatches, and reviews
- Follow users, browse a personalized activity feed, write short posts, comment and like
- Browse film and TV archives with genre/language/period/sort filters
- TV tracking down to seasons and episodes
- Director and actor pages
- Public profile pages with stats, diary, reviews, lists, likes, and watchlists
- Lists, notifications, blocking/muting, content reports, and an admin panel
- CSV data export/import
- Public API endpoints (`/api/public/*`) for external widgets
- Avatar uploads via Cloudflare R2
- Theme system (rose-pine, null-log, nitrate, marquee)

## Architecture

### High-level data flow

```
Browser -> Vite dev server (proxy /api) -> Express 5 backend (on Bun)
                                           |
                                    In-house auth (JWT access + rotating refresh cookies)
                                           |
                                    Domain modules (controller -> service -> repository)
                                           |
                                    Drizzle ORM -> PostgreSQL (Neon in prod, local Postgres in dev/tests)
                                           |
                                    TMDB API (on-demand cache)
```

### Backend layers

```
src/
├── index.ts              # createApp() factory, middleware, global error handler, startServer()
├── types/express.d.ts    # req.user / req.session typing
├── commons/              # Shared cross-cutting concerns
│   ├── auth/             # Session resolution from request headers, suspension check
│   ├── constants/        # Shared activity/archive constants
│   ├── errors/           # AppError and typed subclasses
│   ├── helpers/          # Pagination, param parsing, text helpers
│   ├── http/             # Validation/error response helpers, crawler detection
│   ├── middlewares/      # requireAuth, requireAdmin, blockCrawlers, rate limiters, helmet, trusted-origin check
│   ├── utils/            # asyncHandler, Pino logger
│   └── validation/       # Shared Zod schemas (tmdbId, isoDate, pagination)
├── infrastructure/       # External system integrations
│   ├── cache/            # Generic TTL cache
│   ├── config/           # Zod-validated env, trusted origins
│   ├── database/         # Drizzle client, auth entities, entity barrel, local Neon proxy
│   ├── r2/               # Cloudflare R2 presigned upload URLs
│   ├── routing/          # register-routes.ts (mounts every module router)
│   └── tmdb/             # TMDB API client with caching + DTOs
└── modules/              # Domain modules (22, incl. auth and the shared media/media-interactions code)
```

### Frontend layers

```
src/
├── main.tsx              # Router + QueryClient bootstrap
├── routes/               # TanStack Router file-based routes
├── features/             # Domain features (25 features; Films/TV shared code in `media`)
│   └── <feature>/
│       ├── api.ts        # API calls with Zod validation
│       ├── hooks/        # React Query hooks + query key factories
│       ├── components/   # Feature-specific UI components
│       └── pages/        # Page-level components
├── components/           # Shared UI (`ui/`), layout and film/rating components
├── lib/                  # Core utilities
│   ├── api-client.ts     # Generic fetch wrapper with timeout + error handling
│   ├── query-client.ts   # QueryClient configuration
│   ├── router/           # Auth guards, param parsers, safe redirects, RouteErrorBoundary
│   └── utils.ts          # cn() utility (clsx + tailwind-merge)
└── types/                # Shared TypeScript types + Zod schemas
```

### Module pattern (backend)

Every domain module follows the same layered structure:

```
<module>.routes.ts       # express.Router(), each handler wrapped in asyncHandler()
<module>.controller.ts   # Static class: HTTP req/res, input validation, calls service
<module>.service.ts      # Static facade: delegates to specialized sub-services
<module>.entity.ts       # Drizzle pgTable schema definition
dto/                     # Zod schemas for request/response validation
repositories/            # Direct DB access via Drizzle (static methods)
services/                # Business logic sub-services (read/write split)
helpers/                 # Pure utility functions (formatting, normalization)
types/                   # TypeScript type definitions
constants/               # Magic values, defaults, enums
policies/                # Business rules (e.g., username/password policy)
```

Not every module has every folder. Films and TV live in `modules/films` and `modules/tv`; code both use goes in `modules/media` (see [ADR 0003](docs/adr/0003-films-and-tv-as-code-naming-wire-names-unchanged.md)). URLs, API paths, tables and JSON keep `movies`/`serials`/`movie`/`tv`.

### Feature pattern (frontend)

Every feature follows a consistent structure:

```
feature/
├── api.ts           # API functions returning typed promises, Zod-validated
├── hooks/           # Custom React Query hooks (useQuery, useMutation, useInfiniteQuery)
│   └── use<Feature>.ts
├── components/      # Reusable UI components for this feature
├── pages/           # Page-level components composed for routes
└── types.ts         # Local type definitions (if not in api.ts)
```

Folders are added as needed; larger features (`films`, `tv`, `profile`) split `api.ts` into an `api/` directory behind it.

### Design principles

- **Feature-first backend**: each domain owns its controller/service/repository/dto/helpers/types. See [apps/api/README.md](apps/api/README.md).
- **TMDB on demand**: film and TV data is fetched from TMDB when first needed and cached locally; there is no bulk mirror or import.
- **Separate models**: diary entries (watch logs) and reviews are modeled separately by design.
- **Read-optimized profiles**: public profile routes are tuned for read-heavy traffic and widget integration.
- **Route-driven frontend**: the frontend is route-driven and feature-oriented, with route-level error boundaries for major layouts.
- **API decomposition**: film/TV frontend APIs are split into `api/{schemas,types,mappers,requests}` submodules behind stable `api.ts` barrels.
- **DTO normalization**: backend query parsing is schema-first with explicit default/clamp normalization.
- **Architecture enforcement**: ESLint `max-lines` rules (330 lines per frontend file, 380 per backend file) and backend `bun run lint:arch` prevent oversized files, cross-layer imports, and reintroduction of removed transitional wrappers.
- **Performance-first**: scoped cache invalidation, paginated list endpoints, batched queries (no N+1) and cached external API reads are enforced conventions — see [Performance conventions](#performance-conventions) and the `/performance-check` skill.

## Development setup

### Prerequisites

- Bun 1.3+
- A local PostgreSQL (`docker compose up postgres db-proxy`) — dev and the
  test suite must not run against Neon (it drains the Free plan's monthly
  network-transfer quota); Neon is production-only
- TMDB API access token (Bearer token)

### Docker Compose (fastest path)

```bash
docker compose up
```

Spins up a local Postgres database, applies migrations automatically, and
starts both the API and frontend with hot reload (bind-mounted source) —
`docker compose up` alone is enough for a clean clone to run without any
manual `.env` setup. Copy [`.env.example`](.env.example) to a root `.env` if
you want real TMDB data (`TMDB_ACCESS_TOKEN`) or a non-default
`JWT_ACCESS_SECRET`.

`apps/api`'s database client (`@neondatabase/serverless`) only speaks Neon's
HTTP protocol, so `docker-compose.yml` fronts the local Postgres container
with `ghcr.io/timowilhelm/local-neon-http-proxy` — see
`apps/api/src/infrastructure/database/local-proxy.ts` for how the app
switches to it (`USE_LOCAL_DB_PROXY=true`, set by Docker Compose and the
`apps/api/.env.example` defaults). Migrations run through a separate
direct-`pg` path (`apps/api/scripts/docker-migrate.ts`) since migrations need
multi-statement execution, which Neon's HTTP driver can't do; with
`NODE_ENV=test` the app also talks to Postgres directly over
`DIRECT_DATABASE_URL`.

### Manual per-app setup

1. Clone the repository and enter the project directory.

2. Set up the backend environment:

```bash
cd apps/api
cp .env.example .env
```

Fill in `apps/api/.env` (see [`apps/api/.env.example`](apps/api/.env.example) for the optional R2 and integration keys):

```env
DATABASE_URL=postgres://interis:interis@localhost:5432/interis
DIRECT_DATABASE_URL=postgres://interis:interis@localhost:5432/interis
USE_LOCAL_DB_PROXY=true
JWT_ACCESS_SECRET=<generate-a-random-string, 32+ chars>
TMDB_ACCESS_TOKEN=Bearer <your-tmdb-token>
CORS_ORIGIN=http://localhost:5173
PORT=5000
```

3. Set up the frontend environment:

```bash
cd ../web
```

Create `apps/web/.env`:

```env
VITE_API_PROXY_TARGET=http://localhost:5000
VITE_API_BASE_URL=
```

4. Start the local database and run migrations:

```bash
cd ../..
docker compose up -d postgres db-proxy
cd apps/api
bun install
bun run scripts/docker-migrate.ts   # applies to local Postgres via DIRECT_DATABASE_URL
```

(`bunx drizzle-kit migrate` targets Neon and is for the Render pre-deploy step only.)

5. Start both services:

```bash
# Terminal 1 - backend
cd apps/api
bun run dev

# Terminal 2 - frontend
cd apps/web
bun install
bun run dev
```

Or, from the repo root, `bun install && bun run install:all` once (the root install also sets up the Husky hook), then `bun run dev` to start both with `concurrently`.

6. Open `http://localhost:5173` in your browser.

## Database workflow

Interis uses Drizzle ORM with PostgreSQL. The schema is defined across entity files in each module and re-exported centrally from `src/infrastructure/database/entities.ts` in FK-dependency order.

### Entity definition order

Entities are exported in dependency order to satisfy foreign key references:

1. Auth tables from `infrastructure/database/auth.entity.ts` (`user`, `authSessions`, `securityAnswers`, `credentials`)
2. Media tables (`films` → `movie`, `tvSeries` → `tv_series` plus the series diary/interaction tables, `people`)
3. User tables (`profiles`, `profileTopPicks`)
4. Activity tables (`diaryEntries`, `reviews` + comments/likes, `filmInteractions` → `movie_interaction`, `posts`, social `follows`/`activities`)
5. Curation tables (`lists`, `listEntries`, `listLikes`)
6. Safety and admin tables (`userBlocks`/`userMutes`, `notifications`, `reports`, `adminAuditLog`)

### Adding a new table

1. Create `<module>.entity.ts` in the appropriate module directory.
2. Define the table using `pgTable` from Drizzle.
3. Declare FKs with `.references(() => other.id, { onDelete: ... })`. Module queries use explicit joins, so Drizzle `relations()` are optional (only the auth entities declare them).
4. Add an explicit `index()` for every column that will be filtered or joined on (FK columns like `userId`/`movieId`, anything used in a `WHERE`/`JOIN` elsewhere) — the primary key alone won't cover those lookups. See `diary.entity.ts` or `social.entity.ts` for the pattern.
5. Export the entity file from `src/infrastructure/database/entities.ts` in FK order.
6. Generate and apply the migration:

```bash
bunx drizzle-kit generate            # writes the SQL to drizzle/
bun run scripts/docker-migrate.ts    # applies it to your local Postgres
```

### Drizzle configuration

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/infrastructure/database/entities.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

## Coding conventions

### General

- Use TypeScript everywhere. No JavaScript files.
- Use ES modules (`import`/`export`), not CommonJS.
- Use `bun` for all package management and script execution.
- Keep files focused. One responsibility per file.
- Prefer explicit types over `any`. Let inference work where it is clear.
- Use `async`/`await`, not `.then()` chains.

### Naming

- Backend: `kebab-case` files with a layer suffix (`films-cache.service.ts`, `diary.dto.ts`; middlewares and `asyncHandler.ts` are named after their export), `PascalCase` for classes, `camelCase` for functions/variables.
- Frontend: `PascalCase` files for React components (shadcn-style primitives in `components/ui/` stay lowercase), `use<Thing>.ts` for hooks, `kebab-case` for other modules, `camelCase` for functions/variables.
- API routes: `kebab-case` (e.g., `/api/viewer-status`).
- Database tables: `camelCase` for Drizzle table exports (`diaryEntries`), singular `snake_case` for actual table names (`diary_entry`).
- Code says Film/Series/Tv; wire names (URLs, API paths, tables, JSON) keep `movies`/`serials`/`movie`/`tv`.

### Imports

- Group imports: standard library, third-party, internal.
- Use `@/` path alias in frontend imports.
- The backend has no path alias; use relative imports.

## Backend conventions

### Controllers

- Static classes with methods that map to route handlers.
- Extract and validate input from `req.params`, `req.query`, `req.body`.
- Call service methods and send responses.
- Never contain business logic.

```typescript
export class ExampleController {
  static async getAll(req: Request, res: Response): Promise<void> {
    const parsed = ExampleQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await ExampleService.findAll(parsed.data);
    res.status(200).json(result);
  }
}
```

### Services

- Static facades that delegate to specialized sub-services.
- Contain business logic, orchestration, and data transformation.
- Never touch `req` or `res` directly.

```typescript
export class ExampleService {
  static async findAll(params: QueryParams) {
    return ExampleReadService.findAll(params);
  }
}
```

### Repositories

- Static classes with direct Drizzle database operations.
- One method per query pattern.
- Return typed results, never raw SQL.

```typescript
export class ExampleRepository {
  static async findAll(page: number, limit: number) {
    return db.select().from(examples).limit(limit).offset((page - 1) * limit);
  }
}
```

### DTOs

- Zod schemas that define request/response shapes.
- Use `.safeParse()` in controllers for validation.
- On failure, respond with `sendValidationError(res, parsed.error)` (400 with error details).

```typescript
import { z } from 'zod';

export const CreateExampleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});
```

### Error handling

- Wrap all route handlers with `asyncHandler()` (`commons/utils/asyncHandler.ts`), which forwards rejected promises to the global error handler.
- Throw `AppError` subclasses (`NotFoundError`, `ConflictError`, … from `commons/errors/app-error.ts`) in services; the global error handler at the end of `src/index.ts` turns them into `{ error: { message, code, details } }` responses.
- Use `sendBadRequest()`, `sendValidationError()` and friends from `commons/http/validation-response.helper.ts` for validation failures.

### Auth

Auth is in-house (`modules/auth`): a short-lived JWT access token (15 min by default, signed with `JWT_ACCESS_SECRET` via `jose`) and an opaque refresh token that rotates on every use, both in HTTP-only cookies. Passwords are hashed with argon2id via `Bun.password`.

- Use `requireAuth` middleware for protected routes. It sets `req.user`/`req.session` and transparently refreshes an expired access token.
- Use `requireAdmin` (after `requireAuth`) for admin-only routes.
- For optional auth, use `resolveViewerUserIdFromHeaders()` from `commons/auth/session-resolver.helper.ts`.

### TMDB integration

- Always use the TMDB client from `infrastructure/tmdb`.
- Film and TV data is cached in the DB on demand, not bulk imported.
- Read paths must not write cache rows: use `FilmsCacheService.findForRead` / `TvCacheService.findForRead` in GET handlers (uncached titles come back unsaved with `id = UNSAVED_MEDIA_ID`), and keep `findOrCreate` for write paths (log, review, list, interaction).
- Wrap any new per-id TMDB read (detail, credits, similar/recommendations, etc.) with `createCachedTmdbFetcher` from `infrastructure/tmdb/tmdb-cache.helper.ts` — it gives you TTL caching and in-flight request de-duplication for free. Don't write a bespoke `Map`-based cache per endpoint.

## Frontend conventions

### Components

- Functional components with TypeScript.
- Use `cn()` from `@/lib/utils` for conditional class names.
- Use theme role tokens (`--fg`, `--muted-foreground`, `--line`, `--film`, `--series`, …), `shell-*`/`surface` classes and `text-muted-foreground`/`border-border/*` utilities instead of hardcoded colours.
- Modals use the project's own `ModalShell` (`@/components/ui/ModalShell`) with a controlled `isOpen` and a `theme-modal-panel` content element, not Radix Dialog — see `FeedReviewEditDialog.tsx`.
- Keep components small and focused.
- Extract reusable UI to `src/components/ui/`.
- Keep feature-specific components in `src/features/<feature>/components/`.

```tsx
import { cn } from '@/lib/utils';

interface ExampleCardProps {
  title: string;
  className?: string;
}

export function ExampleCard({ title, className }: ExampleCardProps) {
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <h3>{title}</h3>
    </div>
  );
}
```

### API functions

- Live in `src/features/<feature>/api.ts`.
- Use the `apiRequest<TResponse, TBody>(path, options)` helper from `@/lib/api-client`, not raw `fetch`.
- Validate responses with Zod schemas.
- Include cookies via `credentials: 'include'` (handled by `apiRequest`).

```typescript
import { z } from 'zod';
import { apiRequest, type QueryRequestOptions } from '@/lib/api-client';

const ExampleSchema = z.object({ id: z.number(), name: z.string() });

export async function fetchExamples({ signal }: QueryRequestOptions = {}) {
  const response = await apiRequest<unknown>('/api/examples', { signal });
  return ExampleSchema.array().parse(response);
}
```

### React Query hooks

- Live in `src/features/<feature>/hooks/`.
- Export query key factories as `<feature>Keys`.
- Use `useQuery` for reads, `useMutation` for writes.
- Invalidate only the specific query key(s) that actually changed after a mutation — never invalidate a whole top-level key (`queryKey: feedKeys.all` / `["movies"]`) unless every query in that namespace genuinely needs to refetch. TanStack Query matches by prefix, so a broad invalidation silently refetches every unrelated cached query in that namespace.
- Any list tied to user-generated content (feed, likes, watchlist, reviews) should use `useInfiniteQuery` with a bounded page size, not a plain `useQuery` that fetches the whole collection.

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchExamples, createExample } from '../api';

export const exampleKeys = {
  all: ['examples'] as const,
  lists: () => [...exampleKeys.all, 'list'] as const,
  detail: (id: number) => [...exampleKeys.all, 'detail', id] as const,
};

export function useExamples() {
  return useQuery({ queryKey: exampleKeys.lists(), queryFn: fetchExamples });
}

export function useCreateExample() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExample,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });
    },
  });
}
```

### Routing

- Routes are defined in `src/routes/` using TanStack Router file-based routing.
- Use `beforeLoad` for auth guards and param validation.
- Use `loader` for data prefetching.
- Use `validateSearch` for query parameter validation.

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { requireAuthenticatedUser } from '@/lib/router/auth-guards';

export const Route = createFileRoute('/settings')({
  beforeLoad: async ({ context, location }) => {
    await requireAuthenticatedUser({
      queryClient: context.queryClient,
      redirectPath: location.pathname,
    });
  },
  component: SettingsLayoutRoute,
});
```

### Auth guards

Use the provided guards from `@/lib/router/auth-guards`:

- `requireAuthenticatedUser({ queryClient, redirectPath })` - redirects to `/login` if not authenticated, and to `/setup-security-question` if the user has no security question yet.
- `requireGuestUser(queryClient)` - redirects to `/movies` if already authenticated.
- `requireAdminUser({ queryClient, redirectPath })` - redirects to `/` if not an admin.

### Error handling

- Use `ApiError` from `@/lib/api-client` for API errors.
- Use `isApiError()` type guard for conditional handling.
- Display user-friendly error messages in the UI.

## Performance conventions

Apply these to every new feature, not just when something is already slow:

- **Query invalidation**: invalidate only the specific keys a mutation actually changes — never a bare top-level key (see [React Query hooks](#react-query-hooks) above).
- **No background polling**: never add `refetchInterval` (or any timer) that hits a DB-backed endpoint — it keeps Neon compute awake. Refetch on focus, mount or mutation instead.
- **No DB writes from read paths**: GET handlers use `findForRead`, never `findOrCreate` (see [TMDB integration](#tmdb-integration)).
- **Crawlers stay off the API**: `blockCrawlers` refuses crawler requests before any DB work; only `/api/users/:username/**` is crawlable. Widen `CRAWLABLE_PATH_PATTERN` only deliberately.
- **External API calls**: cache per-id reads from TMDB (or any third-party API) with `createCachedTmdbFetcher` (see [TMDB integration](#tmdb-integration) above) instead of hitting the network on every request.
- **Independent async work**: run independent `await`s via `Promise.all`, not sequentially.
- **N+1 queries**: never loop over rows firing one query per row. Batch-fetch with `inArray(...)`, build a `Map` for lookup, then assemble results in a synchronous pass.
- **Pagination**: any list endpoint tied to user-generated content (feed, likes, watchlist, reviews, lists) must be bounded and paginated from day one, with a default limit applied server-side even when the client omits one.
- **Indexes**: see [Adding a new table](#adding-a-new-table) above — every FK/filter column needs an explicit `index()`.
- **Frontend state sync**: don't use `useEffect` + `setState` to copy a prop or query result into local state. Either derive the value during render or force a remount with `key={id}`.
- **List rendering**: wrap repeated grid/list item components in `React.memo` when they render inside a page that also holds unrelated local state (menus, filters, tabs).

Run the `/performance-check` skill (`.claude/skills/performance-check/`) against your diff before opening a PR — it audits for all of the above.

## Adding a new feature

### Backend

1. Create a directory under `src/modules/<feature>/`.
2. Define the entity in `<feature>.entity.ts`.
3. Export the entity file from `src/infrastructure/database/entities.ts` in FK order.
4. Generate and apply the migration (`bunx drizzle-kit generate && bun run scripts/docker-migrate.ts`).
5. Create the repository, service, controller, and routes files.
6. Mount the router in `src/infrastructure/routing/register-routes.ts`.
7. Add DTOs, helpers, types, and constants as needed.
8. Run `bun run lint:arch` to check layer boundaries.

### Frontend

1. Create a directory under `src/features/<feature>/`.
2. Define API functions in `api.ts` with Zod validation.
3. Create React Query hooks in `hooks/`.
4. Build UI components in `components/`.
5. Create the route file in `src/routes/`.
6. Run `bun run routes:generate` to update the route tree.

## Testing

### Backend

Tests use `bun:test`. Integration suites run against a real server instance (`createApp()` listening on a random port) and a real local Postgres.

Core directories:

- `apps/api/tests/integration/<module>/*` - route + auth + DB integration suites
- `apps/api/tests/contract/*` - error/response-shape contract tests
- `apps/api/tests/unit/<module>/*` - pure helper/service unit tests
- `apps/api/tests/support/app/*` - test server, HTTP client, cookie jar, auth-flow helpers
- `apps/api/tests/support/db/*` - test database helpers
- `apps/api/tests/support/factories/*` - deterministic test data builders

Minimal pattern (`tests/integration/<module>/example.test.ts`):

```typescript
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { startTestServer } from "../../support/app/test-server";

describe("health", () => {
  let server: Awaited<ReturnType<typeof startTestServer>> | null = null;

  beforeAll(async () => {
    server = await startTestServer();
  });

  afterAll(async () => {
    await server?.close();
  });

  it("returns 200", async () => {
    const response = await apiRequest(server!.baseUrl, "/api/health");
    expect(response.status).toBe(200);
  });
});
```

Run tests (needs a local Postgres up — `docker compose up postgres db-proxy` —
with `DIRECT_DATABASE_URL` pointing at it; the suite throws rather than fall
back to Neon):

```bash
bun test                    # everything
bun run test:integration
bun run test:contract
bun run test:unit
bun run test:db:reset       # reset the test DB (TEST_DB_ALLOW_RESET=1 for a DB not named "test")
```

### Frontend

Frontend tests use Vitest + React Testing Library + MSW.

Core directories:

- `apps/web/tests/unit/*` - `lib` helpers, shared components and per-feature tests
- `apps/web/tests/integration/*` - feature/API integration tests
- `apps/web/tests/support/msw/*` - API handlers and server setup
- `apps/web/tests/support/render/*` - render helpers

Run tests:

```bash
cd apps/web
bun run test
```

### E2E

Playwright suites live in `apps/e2e/tests/` (`smoke/`, `journeys/`). Playwright starts both dev servers itself, so it needs the backend env (local Postgres, `JWT_ACCESS_SECRET`, a real `TMDB_ACCESS_TOKEN`).

```bash
cd apps/e2e
bun run test:smoke      # or test:journeys, or test for everything
```

## Quality checks

Run these before submitting a PR (or from the repo root: `bun run typecheck && bun run lint && bun run lint:arch && bun run test`):

```bash
# Backend
cd apps/api
bun run typecheck
bun run lint
bun run lint:arch
bun test

# Frontend
cd apps/web
bun run test
bun run typecheck
bun run lint
bun run build
```

A Husky pre-commit hook runs ESLint (`--fix`) on staged `apps/web`/`apps/api`
files automatically — it installs itself the first time you run `bun install`
at the repo root (`prepare` script), so no separate setup step is needed.

### CI

GitHub Actions ([`.github/workflows/test-suite.yml`](.github/workflows/test-suite.yml))
runs frontend tests/typecheck/lint, and backend typecheck/lint/architecture
checks plus the full integration, contract and unit suites, on every PR and
push to `master`. The backend runs against a throwaway `postgres:16-alpine`
service container (`DIRECT_DATABASE_URL` points at it) — no Neon database is
involved. The e2e job runs the e2e typecheck and Playwright suite against an
identical container and only needs the `a`
[environment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
for the real `TMDB_ACCESS_TOKEN` secret.

## Submitting changes

1. Create a branch from `master` with a descriptive name (e.g., `feat/movie-reviews`, `fix/diary-rating-display`).
2. Make your changes following the conventions above.
3. Run quality checks (type check, lint, tests, build).
4. Commit with a clear message describing what changed and why.
5. Open a pull request — the [PR template](.github/pull_request_template.md) prompts for:
   - A summary of the changes.
   - Any relevant screenshots or screen recordings for UI changes.
   - Notes on database migrations if applicable.

### Commit message format

Use a simple prefix convention, optionally with a scope (`refactor(web):`, `fix(api):`):

- `feat:` - new feature
- `fix:` - bug fix
- `refactor:` - code restructuring without behavior change
- `docs:` - documentation changes
- `chore:` - tooling, config, or maintenance changes
- `test:` - test additions or modifications

Examples:

```
feat: add TV series archive page
fix: resolve duplicate auth cookie issue
refactor(api): split films service into read/write sub-services
docs: update backend README with module patterns
```

### Code review checklist

Before requesting review, verify:

- [ ] TypeScript compiles without errors
- [ ] Lint passes with no warnings
- [ ] Tests pass (backend and frontend)
- [ ] Build succeeds (frontend)
- [ ] Environment variable changes are documented
- [ ] Database migrations are included for schema changes
- [ ] API contracts are validated with Zod on both sides
- [ ] New routes have appropriate auth guards
- [ ] New list endpoints are paginated/bounded, and mutations invalidate only the specific queries that changed (see [Performance conventions](#performance-conventions))

## Adding a custom theme

Themes in Interis are a full-stack feature spanning backend validation, frontend CSS tokens, a runtime registry, and UI components. Adding a new theme requires coordinated changes across 6 files but **no database migration** (the theme column is stored as `text`).

See [ADDING-THEMES.md](ADDING-THEMES.md) for the complete step-by-step guide, which covers:
- How the theme system architecture works
- All required CSS token categories
- Step-by-step instructions for adding a theme
- How to retire a theme without breaking existing users
- File checklist for verification
