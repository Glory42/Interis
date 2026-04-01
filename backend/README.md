# Backend (API)

Express 5 + TypeScript API for This is Cinema.

## What this service does

- Authentication/session handling with Better Auth
- Movie data orchestration (TMDB + local cache)
- Diary logging, reviews, comments, likes, follows
- Social feed and profile APIs
- Signed uploads for avatars/backdrops (Cloudflare R2)
- Public widget endpoints under `/api/public/*`

## Stack

- Runtime: Bun
- Framework: Express 5
- DB: PostgreSQL (Neon)
- ORM: Drizzle ORM
- Auth: Better Auth
- Validation/parsing: Zod

## Getting started

```bash
cd backend
bun install
bun run dev
```

Default server port is `3000` unless `PORT` is set.

## Environment variables

Create `backend/.env`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `BETTER_AUTH_URL` | yes | Backend public base URL (ex: `http://localhost:5000`) |
| `BETTER_AUTH_SECRET` | yes | Better Auth signing/encryption secret |
| `TMDB_ACCESS_TOKEN` | yes | TMDB Bearer token |
| `CORS_ORIGIN` | yes | Frontend origin (ex: `http://localhost:5173`) |
| `PORT` | no | Express port (default `3000`) |
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
```

Type-check command used in development:

```bash
bunx tsc --noEmit
```

## Database and migrations

- Drizzle config: `backend/drizzle.config.ts`
- Entities export: `backend/src/infrastructure/database/entities.ts`
- SQL migrations output: `backend/drizzle/`

Common Drizzle commands:

```bash
cd backend
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

## API surface (high-level)

- `/api/auth/*` - Better Auth handlers
- `/api/movies` - search, detail, archive, logs, trending
- `/api/diary` - private diary CRUD
- `/api/users` - profile + account + tab endpoints
- `/api/reviews` - review CRUD, comments, likes
- `/api/posts` - post CRUD, comments, likes
- `/api/social` - feed and follow graph
- `/api/interactions` - per-movie interaction state
- `/api/uploads` - signed upload request/confirm
- `/api/public` - rate-limited public profile stats/recent/top4/contributions

## Project structure

```text
backend/
├── drizzle/
├── drizzle.config.ts
└── src/
    ├── index.ts                      # app bootstrap + router mounting
    ├── commons/                      # shared middleware/helpers
    │   ├── auth/
    │   ├── http/
    │   ├── middlewares/
    │   └── validation/
    ├── infrastructure/
    │   ├── auth/                     # Better Auth config
    │   ├── database/                 # db client + entities
    │   ├── r2/                       # upload signing/deletion helpers
    │   └── tmdb/                     # TMDB client + DTO parsers
    └── modules/
        ├── diary/
        ├── interactions/
        ├── movies/
        ├── posts/
        ├── public/
        ├── reviews/
        ├── social/
        ├── uploads/
        └── users/
```

Each module follows a feature-first pattern (`controller`, `service`, `repository`, `dto`, `helpers`, `types`) where applicable.

## Notes

- Movie data is fetched from TMDB on demand and cached locally.
- Session-based auth relies on cookies; frontend requests must use `credentials: include`.
- Public endpoints are intentionally rate-limited to protect backend resources.
