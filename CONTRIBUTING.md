# Contributing to Interis

Thank you for your interest in contributing to Interis. This document covers the project architecture, development workflow, coding conventions, and guidelines for submitting changes.

## Table of contents

- [Project overview](#project-overview)
- [Architecture](#architecture)
- [Development setup](#development-setup)
- [Database workflow](#database-workflow)
- [Coding conventions](#coding-conventions)
- [Backend conventions](#backend-conventions)
- [Frontend conventions](#frontend-conventions)
- [Adding a new feature](#adding-a-new-feature)
- [Testing](#testing)
- [Quality checks](#quality-checks)
- [Adding a custom theme](#adding-a-custom-theme)
- [Submitting changes](#submitting-changes)

## Project overview

Interis is a social movie journal app inspired by Letterboxd. It is a monorepo with two packages:

| Package | Purpose |
| --- | --- |
| `backend/` | Express 5 API with Drizzle ORM, Better Auth, TMDB integration |
| `frontend/` | React 19 SPA with TanStack Router + Query, Tailwind CSS |

Both packages run on Bun. The frontend proxies `/api` requests to the backend during development.

### Key capabilities

- Log movie watches with dates, ratings (0.5-5 scale), rewatches, and reviews
- Follow users and browse a personalized activity feed
- Browse a cinema archive with genre/language/time/sort filters
- TV series support with seasons/episodes
- Director and actor pages
- Public profile pages with stats, lists, likes, and watchlists
- Public API endpoints (`/api/public/*`) for external widgets
- Avatar uploads via Cloudflare R2
- Theme system (rose-pine, null-log, gruvbox)

## Architecture

### High-level data flow

```
Browser -> Vite dev server (proxy /api) -> Express backend
                                           |
                                    Better Auth (cookies)
                                           |
                                    Domain modules (controller -> service -> repository)
                                           |
                                    Drizzle ORM -> PostgreSQL (Neon)
                                           |
                                    TMDB API (on-demand cache)
```

### Backend layers

```
src/
├── index.ts              # createApp() factory, middleware, router mounting
├── commons/              # Shared cross-cutting concerns
│   ├── auth/             # Session resolution from request headers
│   ├── http/             # Validation response helpers
│   ├── middlewares/      # requireAuth, requireAdmin, authCookieHeader
│   ├── utils/            # asyncHandler wrapper, Pino logger
│   ├── validation/       # Shared Zod schemas (tmdbId, isoDate)
│   └── types/            # Express Request augmentation (user, session)
├── infrastructure/       # External system integrations
│   ├── auth/             # Better Auth configuration + database hooks
│   ├── database/         # Drizzle client + entity definitions
│   ├── r2/               # Cloudflare R2 presigned upload URLs
│   └── tmdb/             # TMDB API client with caching + DTOs
└── modules/              # Domain features (12 modules)
```

### Frontend layers

```
src/
├── main.tsx              # Router + QueryClient bootstrap
├── routes/               # TanStack Router file-based routes
├── features/             # Domain features (16 features)
│   └── <feature>/
│       ├── api.ts        # API calls with Zod validation
│       ├── hooks/        # React Query hooks + query key factories
│       ├── components/   # Feature-specific UI components
│       └── pages/        # Page-level components
├── components/           # Shared UI + layout components
├── lib/                  # Core utilities
│   ├── api-client.ts     # Generic fetch wrapper with timeout + error handling
│   ├── query-client.ts   # QueryClient configuration
│   ├── router/           # Auth guards, param parsers, safe redirects
│   └── utils.ts          # cn() utility (clsx + tailwind-merge)
└── types/                # Shared TypeScript types + Zod schemas
```

### Module pattern (backend)

Every domain module follows the same layered structure:

```
<module>.routes.ts       # Express Router, mounts controller methods with asyncHandler
<module>.controller.ts   # Static class: HTTP req/res, input validation, calls service
<module>.service.ts      # Static facade: delegates to specialized sub-services
<module>.entity.ts       # Drizzle pgTable schema definition
dto/                     # Zod schemas for request/response validation
repositories/            # Direct DB access via Drizzle (static methods)
services/                # Business logic sub-services (read/write split)
helpers/                 # Pure utility functions (formatting, normalization)
types/                   # TypeScript type definitions
constants/               # Magic values, defaults, enums
policies/                # Business rules (e.g., username policy)
```

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

## Development setup

### Prerequisites

- Bun 1.3+
- PostgreSQL (Neon recommended for cloud dev)
- TMDB API access token (Bearer token)

### Initial setup

1. Clone the repository and enter the project directory.

2. Set up the backend environment:

```bash
cd backend
cp .env.example .env  # if available, otherwise create manually
```

Fill in `backend/.env`:

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SECRET=<generate-a-random-string>
TMDB_ACCESS_TOKEN=Bearer <your-tmdb-token>
CORS_ORIGIN=http://localhost:5173
PORT=5000
```

3. Set up the frontend environment:

```bash
cd ../frontend
```

Create `frontend/.env`:

```env
VITE_API_PROXY_TARGET=http://localhost:5000
VITE_API_BASE_URL=
```

4. Run database migrations:

```bash
cd ../backend
bun install
bunx drizzle-kit migrate
```

5. Start both services:

```bash
# Terminal 1 - backend
cd backend
bun run dev

# Terminal 2 - frontend
cd frontend
bun install
bun run dev
```

6. Open `http://localhost:5173` in your browser.

## Database workflow

Interis uses Drizzle ORM with PostgreSQL. The schema is defined across entity files in each module and re-exported centrally from `src/infrastructure/database/entities.ts` in FK-dependency order.

### Entity definition order

Entities are exported in dependency order to satisfy foreign key references:

1. Auth tables (`user`, `session`, `account`, `verification`)
2. Core content tables (`movies`, `tvSeries`, `people`)
3. User tables (`profiles`)
4. Activity tables (`diaryEntries`, `reviews`, `interactions`, `posts`, `social`)
5. Curation tables (`lists`, `listEntries`)

### Adding a new table

1. Create `<module>.entity.ts` in the appropriate module directory.
2. Define the table using `pgTable` from Drizzle.
3. Add relations using `relations()` if the table has FK relationships.
4. Export the table and relations from `src/infrastructure/database/entities.ts`.
5. Generate and apply the migration:

```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

### Drizzle configuration

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/infrastructure/database/entities.ts',
  out: './drizzle',
  dialect: 'postgresql',
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

- Backend: `kebab-case` for files, `PascalCase` for classes, `camelCase` for functions/variables.
- Frontend: `kebab-case` for files, `PascalCase` for React components, `camelCase` for functions/variables.
- API routes: `kebab-case` (e.g., `/api/movie-logs`).
- Database tables: `camelCase` singular for Drizzle entity names, snake_case for actual table names.

### Imports

- Group imports: standard library, third-party, internal.
- Use `@/` path alias in frontend imports.
- Use relative imports within the same module on the backend.

## Backend conventions

### Controllers

- Static classes with methods that map to route handlers.
- Extract and validate input from `req.params`, `req.query`, `req.body`.
- Call service methods and send responses.
- Never contain business logic.

```typescript
export class ExampleController {
  static async getAll(req: Request, res: Response) {
    const { page, limit } = req.query;
    const result = await ExampleService.findAll({ page, limit });
    res.json(result);
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
- Return 400 with error details on failure.

```typescript
import { z } from 'zod';

export const CreateExampleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});
```

### Error handling

- Wrap all route handlers with `asyncHandler()`.
- Throw errors in services; let the global error handler catch them.
- Use `sendBadRequest()` for validation failures.

### Auth

- Use `requireAuth` middleware for protected routes.
- Use `requireAdmin` for admin-only routes.
- Access the current user via `req.user` (attached by `requireAuth`).
- For optional auth, use `resolveViewerUserIdFromHeaders()` from `commons/auth`.

### TMDB integration

- Always use the TMDB client from `infrastructure/tmdb`.
- The client handles caching, deduplication, and error handling.
- Movie data is cached on demand, not bulk imported.

## Frontend conventions

### Components

- Functional components with TypeScript.
- Use `cn()` from `@/lib/utils` for conditional class names.
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
- Use the `apiRequest<TResponse, TBody>()` helper from `@/lib/api-client`.
- Validate responses with Zod schemas.
- Include cookies via `credentials: 'include'` (handled by `apiRequest`).

```typescript
import { apiRequest } from '@/lib/api-client';
import { z } from 'zod';

const ExampleSchema = z.object({ id: z.number(), name: z.string() });

export async function fetchExamples() {
  const response = await apiRequest<z.infer<typeof ExampleSchema>[]>({
    method: 'GET',
    url: '/api/examples',
  });
  return ExampleSchema.array().parse(response);
}
```

### React Query hooks

- Live in `src/features/<feature>/hooks/`.
- Export query key factories as `<feature>Keys`.
- Use `useQuery` for reads, `useMutation` for writes.
- Invalidate relevant queries after mutations.

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
import { createFileRoute, redirect } from '@tanstack/react-router';
import { requireAuthenticatedUser } from '@/lib/router/auth-guards';

export const Route = createFileRoute('/settings/profile')({
  beforeLoad: async ({ context }) => {
    await requireAuthenticatedUser(context);
  },
  component: ProfileSettingsPage,
});
```

### Auth guards

Use the provided guards from `@/lib/router/auth-guards`:

- `requireAuthenticatedUser()` - redirects to `/login` if not authenticated.
- `requireGuestUser()` - redirects to `/cinema` if already authenticated.
- `requireAdminUser()` - redirects to `/` if not an admin.

### Error handling

- Use `ApiError` from `@/lib/api-client` for API errors.
- Use `isApiError()` type guard for conditional handling.
- Display user-friendly error messages in the UI.

## Adding a new feature

### Backend

1. Create a directory under `src/modules/<feature>/`.
2. Define the entity in `<feature>.entity.ts`.
3. Export the table and relations from `src/infrastructure/database/entities.ts`.
4. Generate and apply the migration.
5. Create the repository, service, controller, and routes files.
6. Register the router in `src/index.ts`.
7. Add DTOs, helpers, types, and constants as needed.

### Frontend

1. Create a directory under `src/features/<feature>/`.
2. Define API functions in `api.ts` with Zod validation.
3. Create React Query hooks in `hooks/`.
4. Build UI components in `components/`.
5. Create the route file in `src/routes/`.
6. Run `bun run routes:generate` to update the route tree.

## Testing

### Backend

Tests use `bun:test`. The pattern is integration testing with a real Express server:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { createApp } from '../index';

describe('Example', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  afterAll(() => {
    // cleanup
  });

  it('should return 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });
    expect(response.statusCode).toBe(200);
  });
});
```

Run tests:

```bash
bun test
```

### Frontend

Currently, the frontend relies on type checking and linting for quality assurance. Add unit tests as the test framework is established.

## Quality checks

Run these before submitting a PR:

```bash
# Backend
cd backend
bunx tsc --noEmit
bun test

# Frontend
cd frontend
bun run typecheck
bun run lint
bun run build
```

## Submitting changes

1. Create a branch from `main` with a descriptive name (e.g., `feat/movie-reviews`, `fix/diary-rating-display`).
2. Make your changes following the conventions above.
3. Run quality checks (type check, lint, tests, build).
4. Commit with a clear message describing what changed and why.
5. Open a pull request with:
   - A summary of the changes.
   - Any relevant screenshots or screen recordings for UI changes.
   - Notes on database migrations if applicable.

### Commit message format

Use a simple prefix convention:

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
refactor: split movies service into read/write sub-services
docs: update backend README with module patterns
```

### Code review checklist

Before requesting review, verify:

- [ ] TypeScript compiles without errors
- [ ] Lint passes with no warnings
- [ ] Tests pass (backend)
- [ ] Build succeeds (frontend)
- [ ] Environment variable changes are documented
- [ ] Database migrations are included for schema changes
- [ ] API contracts are validated with Zod on both sides
- [ ] New routes have appropriate auth guards

## Adding a custom theme

Themes in Interis are a full-stack feature spanning backend validation, frontend CSS tokens, a runtime registry, and UI components. Adding a new theme requires coordinated changes across 6 files but **no database migration** (the theme column is stored as `text`).

See [ADDING-THEMES.md](ADDING-THEMES.md) for the complete step-by-step guide, which covers:
- How the theme system architecture works
- All required CSS token categories
- Step-by-step instructions for adding a theme
- How to retire a theme without breaking existing users
- File checklist for verification
