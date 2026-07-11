---
name: codebase-audit
description: Full health audit of the Interis codebase — architectural violations, dead code, missing exports, unresolved TODOs, schema/code drift, and doc gaps. Use when the user says "audit the codebase", "health check", "/codebase-audit", or before a major release or after a long feature sprint.
---

# Codebase Audit — Interis

A structured health check across backend and frontend. Run after a sprint, before a release, or when the codebase feels like it's accumulated debt. Reports issues grouped by severity; does not auto-fix anything unless the user asks.

## Scope

Default: full `apps/api/src` and `apps/web/src` trees plus migrations and docs.
If the user scopes it ("just the serials module", "just frontend"), honour that.

Use the `Explore` agent for the search legwork — it keeps the main context window clean.

---

## Audit areas

### 1. Architecture layer violations
Run `bun run lint:arch` from `apps/api/`. Capture any violations and report them verbatim. This catches:
- Controllers importing repositories directly (must go through service)
- Services importing controllers
- Repositories importing services
- DTOs importing services/repositories/controllers

If `lint:arch` passes, note that explicitly.

### 2. Oversized files
In `apps/api/src/modules/`, list every `.ts` file over 380 lines (the project limit from CLAUDE.md). Run:
```bash
find apps/api/src/modules -name "*.ts" | xargs wc -l | sort -rn | head -20
```
Flag files that exceed the limit and which layer they're in (controller / service / repository).

### 3. Missing DB indexes
For every `*.entity.ts` in `apps/api/src/modules/`, check that every FK column (`userId`, `movieId`, `seriesId`, etc.) and any column used in `WHERE`/`JOIN` elsewhere has an explicit `index()` in the entity definition. The PK alone doesn't cover lookups by other columns.

Reference: `diary.entity.ts`, `social.entity.ts` for the pattern.

### 4. Schema / migration drift
Check that every entity exported from `apps/api/src/infrastructure/database/entities.ts` has a corresponding migration covering its current shape. Look for columns that exist in entity files but have no `ALTER TABLE ... ADD COLUMN` in any migration — this suggests a schema was edited without running `bunx drizzle-kit generate`.

### 5. Unregistered entities
Scan `apps/api/src/modules/*/*.entity.ts` and cross-check against `apps/api/src/infrastructure/database/entities.ts`. Flag any entity that is defined but never exported from the central file (Drizzle won't track it for migrations).

### 6. Dead / orphaned routes
In `apps/api/src/index.ts` find every `app.use(...)` registration. For each, confirm the imported router file exists and exports a valid Express router. Also grep for any `*.routes.ts` file that is never imported by `index.ts`.

### 7. Unresolved TODOs and FIXMEs
```bash
grep -rn "TODO\|FIXME\|HACK\|XXX" apps/api/src apps/web/src --include="*.ts" --include="*.tsx" | grep -v "node_modules"
```
Group by module. Distinguish between `TODO` (intentional deferral) and `FIXME` / `HACK` (known broken / workaround code that needs resolution).

### 8. Frontend route tree consistency
Check that every file under `apps/web/src/routes/` is properly included in the generated route tree (`apps/web/src/routeTree.gen.ts`). If a route file exists but is absent from the tree, the developer likely added a route file without running `bun run routes:generate`.

### 9. Stale public API docs
For every route registered under `/api/public` in `apps/api/src/modules/public/`, confirm there is a corresponding `.md` file in `apps/docs/src/content/docs/api/endpoints/` and that the endpoint table in `apps/docs/src/content/docs/api/overview.md` lists it. Flag any public route without documentation.

### 10. Unused exports (spot check)
Grep for types, constants, or helper functions that are exported but have zero imports anywhere in the project. Focus on:
- `apps/api/src/modules/*/types/*.ts`
- `apps/api/src/modules/*/constants/*.ts`
- `apps/api/src/modules/*/helpers/*.ts`

Run targeted greps: export name → count of imports. Flag anything with 0 usages outside its own file.

---

## Report format

Group findings by severity:

**Critical** — will cause a runtime bug, silent data loss, or break a contributor's workflow (e.g. architecture violations, unregistered entities, missing migration coverage)

**Warning** — technical debt that will hurt over time (oversized files, missing indexes on growing tables, stale docs for shipped public API endpoints)

**Info** — low-priority notices (unresolved TODOs, orphaned helper exports)

For each finding: file path (with line number where applicable), one-sentence description of the issue, and the fix action needed.

End the report with a summary line: "X critical, Y warnings, Z info items found."
