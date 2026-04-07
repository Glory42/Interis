# Backend (API)

Express 5 + TypeScript API for Interis.

## What this service does

- Authentication/session handling with Better Auth
- Movie, TV series, and people data orchestration (TMDB + local cache)
- Diary logging, reviews, comments, likes, follows
- Social feed and profile APIs
- Signed uploads for avatars/backdrops (Cloudflare R2)
- Public widget endpoints under `/api/public/*`

## Stack

| Layer | Tech |
| --- | --- |
| Runtime | Bun |
| Framework | Express 5 |
| Database | PostgreSQL (Neon) |
| ORM | Drizzle ORM |
| Auth | Better Auth |
| Validation | Zod |
| Logging | Pino |
| Storage | Cloudflare R2 (S3-compatible) |

## Getting started

```bash
cd backend
bun install
bun run dev
```

Default server port is `5000` unless `PORT` is set.

## Environment variables

Create `backend/.env`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `BETTER_AUTH_URL` | yes | Backend public base URL (ex: `http://localhost:5000`) |
| `BETTER_AUTH_SECRET` | yes | Better Auth signing/encryption secret |
| `TMDB_ACCESS_TOKEN` | yes | TMDB Bearer token |
| `CORS_ORIGIN` | yes | Frontend origin (ex: `http://localhost:5173`) |
| `PORT` | no | Express port (default `5000`) |
| `NODE_ENV` | no | `development` / `production` |
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
bunx tsc --noEmit  # type check
```

## Database and migrations

- Drizzle config: `drizzle.config.ts`
- Entities export: `src/infrastructure/database/entities.ts`
- SQL migrations: `drizzle/`

Common Drizzle commands:

```bash
bunx drizzle-kit generate   # generate migration from schema changes
bunx drizzle-kit migrate    # apply migrations
```

## Project structure

```text
backend/
├── drizzle/                        # SQL migrations
├── drizzle.config.ts
└── src/
    ├── index.ts                    # app bootstrap + router mounting
    ├── commons/                    # shared middleware/helpers
    │   ├── auth/                   # session resolution from headers
    │   ├── http/                   # validation response helpers
    │   ├── middlewares/            # authCookieHeader, requireAuth, requireAdmin
    │   ├── utils/                  # asyncHandler, logger
    │   ├── validation/             # shared Zod schemas (tmdbId, isoDate)
    │   └── types/                  # Express Request augmentation
    ├── infrastructure/
    │   ├── auth/                   # Better Auth config + database hooks
    │   ├── database/               # db client + entity definitions
    │   ├── r2/                     # upload signing/deletion helpers
    │   └── tmdb/                   # TMDB client + DTO parsers
    └── modules/
        ├── diary/                  # Watch log CRUD
        ├── interactions/           # Per-movie like/watchlist state
        ├── lists/                  # User-curated lists (entity only, routes planned)
        ├── movies/                 # Movie search, detail, archive, trending
        ├── people/                 # Director/actor pages
        ├── posts/                  # Short posts with comments/likes
        ├── public/                 # Rate-limited widget endpoints
        ├── reviews/                # Reviews with comments/likes
        ├── serials/                # TV series search, detail, archive
        ├── social/                 # Feed + follow graph
        ├── uploads/                # Signed R2 upload flow
        └── users/                  # Profile, account, theme management
```

## API surface

| Prefix | Auth | Purpose |
| --- | --- | --- |
| `/api/auth/*` | mixed | Better Auth endpoints |
| `/api/movies/*` | public | Search, detail, archive, logs, trending |
| `/api/serials/*` | public | TV series search, detail, archive |
| `/api/people/*` | public | Director/actor pages |
| `/api/diary` | required | Private diary CRUD |
| `/api/users/*` | mixed | Profile + account + tab endpoints |
| `/api/reviews/*` | mixed | Review CRUD, comments, likes |
| `/api/posts/*` | mixed | Post CRUD, comments, likes |
| `/api/social/*` | mixed | Feed and follow graph |
| `/api/interactions/:tmdbId` | required | Per-movie interaction state |
| `/api/uploads/*` | required | Signed upload request/confirm |
| `/api/public/:username/*` | public | Rate-limited profile stats/recent/top4/contributions |

## Architecture patterns

### Layered module structure

Each domain module follows a consistent layered pattern:

```
<module>.routes.ts       -> Express Router, mounts controller methods
<module>.controller.ts   -> HTTP layer: req/res handling, input validation
<module>.service.ts      -> Facade delegating to sub-services
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
- **Facade services**: Top-level `*Service.ts` delegates to specialized sub-services (e.g., `MoviesService` -> `MoviesCacheService`, `MoviesDetailService`, `MoviesArchiveService`)
- **Read/write separation**: Services often split into `*-read.service.ts` and `*-write.service.ts`
- **Find-or-create**: TMDB data cached on-demand (check local DB first, fetch from TMDB if missing)
- **Zod validation**: All DTOs use Zod; controllers validate with `safeParse` and return 400 on failure
- **Async handler wrapper**: All route handlers wrapped with `asyncHandler()` for error propagation
- **Viewer-aware responses**: Optional `resolveViewerUserIdFromHeaders` for personalizing public responses
- **In-memory caching**: TMDB client uses Map-based caches with TTL and in-flight request deduplication
- **Factory pattern**: `createApp()` for testable server creation
- **FK order in schema**: `entities.ts` exports in dependency order to satisfy FK references

## Testing

```bash
bun test
```

Tests use `bun:test` and spin up a real Express server on a random port for integration testing. See `src/infrastructure/auth/auth-session.test.ts` for the pattern.

## Notes

- Movie data is fetched from TMDB on demand and cached locally.
- Session-based auth relies on cookies; frontend requests must use `credentials: include`.
- Public endpoints are intentionally rate-limited to protect backend resources.
- Username policy enforces 3-20 chars, lowercase alphanumeric + underscore, with a reserved list.
- Supported themes: rose-pine, null-log, gruvbox.
