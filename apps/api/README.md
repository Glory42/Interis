# Backend (API)

Express 5 + TypeScript API for Interis.

## What this service does

- Authentication/session handling (in-house: JWT access + rotating refresh tokens, argon2id via `Bun.password`)
- Film, TV series, and people data orchestration (TMDB + local cache)
- Diary logging, reviews, comments, likes, follows, lists, posts
- Social feed, notifications, profile APIs, and title search
- Moderation (block/mute), content reports, and an admin console API
- Diary CSV export and import
- Signed uploads for avatars (Cloudflare R2)
- Public widget endpoints under `https://api.interis.gorkemkaryol.dev/api/public/*`

## Stack

| Layer | Tech |
| --- | --- |
| Runtime | Bun |
| Framework | Express 5 |
| Database | PostgreSQL (Neon in prod, local Postgres for dev/tests) |
| ORM | Drizzle ORM |
| Auth | In-house (JWT via `jose` + `Bun.password`) |
| Validation | Zod |
| Logging | Pino |
| Security | helmet, express-rate-limit |
| Storage | Cloudflare R2 (S3-compatible) |

## Getting started

```bash
cd apps/api
bun install
bun run dev
```

Default server port is `5000` unless `PORT` is set.

## Environment variables

Create `apps/api/.env` (see [`.env.example`](.env.example)). Dev and tests run
against a **local Postgres, never Neon** — `docker compose up postgres db-proxy`
from the repo root brings it up. Neon is production-only (Render env vars).

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string — local for dev (`postgres://interis:interis@localhost:5432/interis`) |
| `DIRECT_DATABASE_URL` | tests | Direct wire-protocol URL for the test suite + migrations; `db.ts` throws in `NODE_ENV=test` if it's unset or a `*.neon.tech` host |
| `USE_LOCAL_DB_PROXY` | dev | `true` routes the neon-http driver through the local proxy on `:4444` |
| `JWT_ACCESS_SECRET` | yes | 32+ chars, signs/verifies access tokens |
| `TMDB_ACCESS_TOKEN` | yes | TMDB Bearer token |
| `CORS_ORIGIN` | prod | Trusted frontend origin(s), comma-separated; defaults to `http://localhost:5173` + `http://127.0.0.1:5173` |
| `PORT` | no | Express port (default `5000`) |
| `NODE_ENV` | no | `development` / `production` / `test` (default `development`) |
| `TZ` | dev | `UTC` — the driver reads naive timestamps back in the process TZ |
| `JWT_ACCESS_TTL_SECONDS`, `REFRESH_TOKEN_TTL_SECONDS` | no | Token lifetimes (default 15 min / 30 days) |
| `AUTH_ACCESS_COOKIE_NAME`, `AUTH_REFRESH_COOKIE_NAME` | no | Cookie names (default `interis_access_token` / `interis_refresh_token`) |
| `R2_ACCOUNT_ID` | uploads only | Cloudflare R2 account id |
| `R2_ACCESS_KEY_ID` | uploads only | R2 access key id |
| `R2_SECRET_ACCESS_KEY` | uploads only | R2 secret key |
| `R2_BUCKET_NAME` | uploads only | R2 bucket name |
| `R2_PUBLIC_URL` | uploads only | Public base URL for uploaded assets |

## Scripts

```bash
bun run dev     # watch mode
bun run start   # single run
bun test        # test suite
bun run test:integration  # integration tests (needs local Postgres)
bun run test:contract     # contract tests
bun run test:unit         # unit tests
bun run db:migrate:local  # apply migrations to local Postgres (scripts/docker-migrate.ts)
bun run test:db:reset     # truncate tables (guarded)
bun run typecheck  # type check
bun run lint       # ESLint (incl. 380-line max per file)
bun run lint:arch  # architecture guard rails
```

## Database and migrations

- Drizzle config: `drizzle.config.ts`
- Entities export: `src/infrastructure/database/entities.ts`
- SQL migrations: `drizzle/`

Common Drizzle commands:

```bash
bunx drizzle-kit generate            # generate migration from schema changes
bun run scripts/docker-migrate.ts    # apply migrations to local Postgres (DIRECT_DATABASE_URL)
bunx drizzle-kit migrate             # apply migrations to Neon — prod / Render pre-deploy only
```

## Project structure

```text
apps/api/
├── drizzle/                        # SQL migrations
├── drizzle.config.ts
├── scripts/
│   ├── architecture-check.ts       # layering checks
│   ├── docker-migrate.ts           # apply migrations to local Postgres over pg
│   ├── backfill-auth-credentials.ts
│   └── test-db-reset.ts            # guarded DB truncate helper
├── tests/                          # bun:test suites
│   ├── integration/                # real Express server + local Postgres
│   ├── contract/                   # response-shape contracts
│   ├── unit/
│   └── support/                    # test server, DB helpers, factories
└── src/
    ├── index.ts                    # createApp(): middleware stack + server bootstrap
    ├── types/                      # Express Request augmentation
    ├── commons/                    # shared middleware/helpers
    │   ├── auth/                   # session resolution from headers, suspension check
    │   ├── constants/, errors/, helpers/  # AppError, pagination helpers, etc.
    │   ├── http/                   # validation response helpers, crawler detection
    │   ├── middlewares/            # requireAuth, requireAdmin, blockCrawlers, rateLimiters,
    │   │                           # requireTrustedOriginForMutations, helmet, securityHeaders
    │   ├── utils/                  # asyncHandler, logger
    │   └── validation/             # shared Zod schemas (tmdbId, isoDate, pagination)
    ├── infrastructure/
    │   ├── cache/                  # in-memory TTL cache helper
    │   ├── config/                 # env validation, trusted origins
    │   ├── database/               # db client, local proxy, auth + entity exports
    │   ├── r2/                     # upload signing/deletion helpers
    │   ├── routing/                # register-routes.ts (mounts every module router)
    │   └── tmdb/                   # TMDB client + DTO parsers
    └── modules/
        ├── admin/                  # Admin console: users, content, media, cache, audit log
        ├── auth/                   # Sign-up/in/out, sessions, password reset, security question
        ├── data-transfer/          # Diary CSV export + import
        ├── diary/                  # Film watch log CRUD
        ├── films/                  # Film search, detail, archive, trending (/api/movies)
        ├── interactions/           # Per-film like/watchlist/rating state
        ├── lists/                  # User-curated lists of films and series
        ├── media/                  # Code shared by films and TV
        ├── media-interactions/     # Shared interaction helpers/repository
        ├── moderation/             # Block / mute
        ├── notifications/          # Notification inbox
        ├── people/                 # Director/actor pages
        ├── posts/                  # Short posts with comments/likes
        ├── public/                 # Rate-limited widget endpoints
        ├── reports/                # Content reports + admin triage
        ├── reviews/                # Reviews with comments/likes
        ├── search/                 # Cross-media title search
        ├── social/                 # Feed + follow graph
        ├── tv/                     # TV search, detail, archive, logs, season/episode tracking (/api/serials)
        ├── uploads/                # Signed R2 upload flow
        ├── users/                  # Profile, account, theme management
        └── viewer-status/          # Viewer's per-title status for cards
```

## API surface

| Prefix | Auth | Purpose |
| --- | --- | --- |
| `/api/health` | public | Health check |
| `/api/auth/*` | mixed | In-house auth: sign-up/in/out, password reset, change password/email, delete account, security question |
| `/api/movies/*` | public | Film search, detail, archive, logs, reviews, trending |
| `/api/serials/*` | mixed | TV search, detail, archive, trending; logs, interactions, season/episode tracking and reviews (auth) |
| `/api/people/*` | public | Director/actor pages + credits |
| `/api/search` | public | Film + TV title search (TMDB) |
| `/api/viewer-status` | optional | Viewer's watched/rating/like/watchlist state for up to 60 titles |
| `/api/diary` | required | Private film diary CRUD |
| `/api/users/*` | mixed | Profile + account + tab endpoints |
| `/api/reviews/*` | mixed | Review CRUD, comments, likes |
| `/api/posts/*` | mixed | Post CRUD, comments, likes |
| `/api/lists/*` | mixed | List CRUD, items, reorder, likes |
| `/api/social/*` | mixed | Feed, follow graph, activity likes |
| `/api/interactions/:tmdbId` | required | Per-film interaction state |
| `/api/moderation/*` | required | Block / mute |
| `/api/notifications/*` | required | Notification list, unread count, mark read |
| `/api/reports/*` | required | Submit reports; triage endpoints are admin-only |
| `/api/data/*` | required | Diary CSV export / import |
| `/api/uploads/*` | required | Signed upload request/confirm |
| `/api/admin/*` | admin | Admin console |
| `/api/public/:username/*` | public | Rate-limited public profile, activity, and collection data |

Public API base (production): `https://api.interis.gorkemkaryol.dev/api/public`

## Architecture patterns

### Layered module structure

Each domain module follows a consistent layered pattern:

```
<module>.routes.ts       -> Express Router, mounts controller methods
<module>.controller.ts   -> HTTP layer: req/res handling, input validation
<module>.service.ts      -> Module orchestration layer
<module>.entity.ts       -> Drizzle pgTable schema
dto/                     -> Zod schemas for request/response types
repositories/            -> Direct DB access via Drizzle
services/                -> Business logic (often read/write split)
helpers/                 -> Pure utility functions
types/                   -> TypeScript type definitions
constants/               -> Magic values, defaults, enums
```

### Key conventions

- **Static classes**: Controllers, services, and repositories use `static` methods (no instantiation)
- **Composed services**: Top-level `*Service.ts` composes focused sub-services (e.g., `FilmsService` -> cache/detail/archive services)
- **Read/write separation**: Services often split into `*-read.service.ts` and `*-write.service.ts`
- **Find-or-create on writes only**: TMDB data is cached on demand by write paths (`findOrCreate`); GET handlers use `findForRead`, which returns an unsaved row for uncached titles instead of inserting one
- **Zod validation + normalization**: DTO/query schemas validate and normalize request input (defaulting/clamping in DTO layer)
- **Async handler wrapper**: All route handlers wrapped with `asyncHandler()` for error propagation
- **Viewer-aware responses**: Optional `resolveViewerUserIdFromHeaders` for personalizing public responses
- **In-memory caching**: TMDB client uses Map-based caches with TTL and in-flight request deduplication via the shared `createCachedTmdbFetcher` helper (`infrastructure/tmdb/tmdb-cache.helper.ts`) — wrap any new per-id TMDB read with it rather than writing a bespoke cache
- **Factory pattern**: `createApp()` for testable server creation
- **FK order in schema**: `entities.ts` exports in dependency order to satisfy FK references
- **Architecture guardrails**: `lint:arch` blocks cross-layer imports (controller->repository, dto->service/repository, etc.); the 380-line file cap is enforced by ESLint (`bun run lint`)

## Testing

```bash
bun test
```

Tests use `bun:test`. Integration suites (`tests/integration/<module>/`) spin up a real Express server on a random port against the local Postgres in `DIRECT_DATABASE_URL`; `tests/contract/` and `tests/unit/` cover response shapes and pure logic. CI (`.github/workflows/test-suite.yml`) runs typecheck, lint, `lint:arch`, migrations, then the integration, contract and unit suites.

## Notes

- Film and TV data is fetched from TMDB on demand and cached locally.
- Auth relies on access + refresh cookies (`requireAuth` transparently rotates an expired access token); frontend requests must use `credentials: include`.
- Ratings are on a 10-"rocket" scale: 0.5–10 in half steps.
- Public endpoints are intentionally rate-limited to protect backend resources.
- Username policy enforces 3-20 chars, lowercase alphanumeric + underscore, with a reserved list.
- Supported themes: rose-pine, null-log, nitrate, marquee.
