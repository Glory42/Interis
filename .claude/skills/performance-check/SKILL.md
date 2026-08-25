---
name: performance-check
description: Audits code for performance issues — broad React Query cache invalidation, uncached external API calls, N+1 queries, sequential awaits that could run in parallel, unbounded/unpaginated list endpoints, missing DB indexes, useEffect-based state syncing, and unmemoized list items. Use when the user says "check performance", "review for perf issues", "/performance-check", or after building a feature that adds a new list endpoint, mutation, or detail page. Also use proactively before considering a new feature done.
---

# Performance Check — Interis

Audits code against the checklist in `CLAUDE.md`'s "Performance guidelines" section — read that section first, it defines the standard this skill enforces. This skill finds violations; it does not fix them unless the user explicitly asks it to.

## Scope

Default to the current diff (uncommitted changes). Determine scope like this:

1. If the user names specific files/features, scope to those.
2. Otherwise, run `git status` and `git diff` to find changed files. Review those.
3. If the user asks for a "full audit" or there's no diff (e.g. reviewing `master` directly), scope to the whole `apps/api/src` and `apps/web/src` trees — use the `Explore` agent for the search legwork so this doesn't blow the main context window.

If the diff is small (a handful of files), just read them directly instead of spawning agents.

## Checklist

Work through each area that applies to the files in scope. Skip areas with no relevant files (e.g. skip DB index checks if no `.entity.ts` changed).

### 1. React Query invalidation scope (frontend mutations)
Grep for `invalidateQueries` in changed hook files. Flag any call that invalidates a bare top-level key (`queryKey: ["movies"]`, `queryKey: feedKeys.all`, or a factory's `.all`) when the mutation only actually changes one entity. TanStack Query matches by prefix, so a bare top-level key nukes every unrelated cached query in that namespace (search results, archive infinite queries, other detail pages) and forces them to refetch.
- Good reference: `apps/web/src/features/interactions/hooks/useInteractions.ts`, `apps/web/src/features/lists/hooks/useLists.ts`.
- Fix: invalidate the specific key(s) that can change for that entity id.

### 2. Uncached external API calls
Grep for direct calls to the TMDB client (`infrastructure/tmdb/*.ts`) or any other third-party API from a request-hot-path (detail endpoint, list endpoint) that isn't wrapped in a cache. Data that doesn't change per-request (movie/series detail, credits, similar/recommendations) must not hit the network on every request.
- Reference: `createCachedTmdbFetcher` in `apps/api/src/infrastructure/tmdb/tmdb-cache.helper.ts`.
- Fix: wrap the fetcher, or reuse an existing cached one.

### 3. Sequential awaits that could be parallel
Read service files touched in the diff. Flag consecutive `await` statements where the second call doesn't use the first call's result — these should be `Promise.all([...])`.

### 4. N+1 queries
Grep for `.map(async` / `for (...)` loops in repository or service files that contain `await db...` or `await SomeRepository....` per iteration. Flag any loop firing one query per row instead of a single batched `inArray(...)` query.
- Reference pattern: `buildFeedFallbackMediaContext` in `apps/api/src/modules/social/helpers/social-feed-context.helper.ts` (collect ids first, batch-fetch, build a `Map`, then a synchronous pass to assemble results).
- Also check for per-row upserts that should be one multi-row `.insert().values([...])` with `onConflictDoUpdate` instead (see `upsertManyEpisodeWatchedState` in `serials-episode-interactions.repository.ts`).

### 5. Unbounded / unpaginated list endpoints
For any new or changed repository method returning an array tied to user-generated content (feed, likes, watchlist, reviews, lists, comments): check it has `.limit(...)` applied, with a sane default even when the caller doesn't pass one. Check the controller actually parses and forwards `limit`/`offset` or `cursor` query params — a repository that supports a limit param is useless if the controller never wires it through.
On the frontend, check the corresponding hook uses `useInfiniteQuery` (or otherwise paginates) rather than a plain `useQuery` that fetches everything, and that the page component has a "Load more" affordance.
- Prefer cursor/keyset pagination (`WHERE (createdAt, id) < cursor`) for feeds that grow continuously and are read out-of-order across sources; offset/limit is fine for simpler single-query bounded lists.
- Reference: `apps/api/src/modules/social/services/social-feed.service.ts` (cursor) and `apps/api/src/modules/users/repositories/users-media-interactions.repository.ts` (offset).

### 6. Missing DB indexes
For any new or changed `*.entity.ts`: does every column used in a `.where(eq(...))`/`inArray(...)` filter or `JOIN` elsewhere in the codebase have an `index()` in that table's definition? The primary key alone does not help lookups by other columns.
- Reference: `diary.entity.ts`, `social.entity.ts` (`activity_user_id_created_at_idx`).
- After adding an index, run `bunx drizzle-kit generate` and confirm a migration file was created; flag if the schema changed without one.

### 7. useEffect state-sync anti-pattern (frontend)
Grep changed `.tsx` files for `useEffect` bodies that just call `setXxx(...)` to copy a prop or query result into local state. This costs an extra render/commit and is a common source of stale-state bugs. Legitimate `useEffect` uses (DOM/window event listeners, timers, scroll locks, non-React APIs) are fine — only flag the "sync into state" shape.
- Fix pattern A (adjust during render): track a `prevValue` state and compare during render, calling `setState` inline instead of in an effect — see `CalendarPicker.tsx`, `SpaceRating.tsx`.
- Fix pattern B (key-based remount): key the component by the entity id so it mounts fresh with correct initial state — see `ListCreateEditDialog.tsx`, `FeedReviewEditDialog.tsx`.

### 8. Missing memoization on repeated list items
Check any new grid/list item component rendered via `.map()` inside a page that also holds unrelated local state (open menus, filters, tabs). If the component takes only plain data props (no unstable inline callbacks), wrap it in `React.memo`. If it takes callback props, those must be `useCallback`'d in the parent too, or memoizing the child is a no-op.
- Reference: `ArchiveMovieCard.tsx`, `GridSeriesCard.tsx`.

## Reporting format

Report findings grouped by tier, most severe first. Do not fix anything unless the user asked for that explicitly.

**Tier 1 — measurable user-facing cost** (broad invalidation on a frequent mutation, N+1/uncached calls in a hot path, unbounded fetch that will grow with user data)
**Tier 2 — real but lower-severity** (missing index on a low-traffic table, useEffect smell with no visible bug yet, missing memoization)

For each finding give: `file:line`, one-line description of the defect, the concrete scenario where it costs something (e.g. "clicking like on a feed item refetches the entire trending rail"), and the fix pattern to apply (point at the reference file above rather than re-explaining the pattern each time).

If nothing in scope violates the checklist, say so plainly — don't invent marginal nitpicks to pad the report.
