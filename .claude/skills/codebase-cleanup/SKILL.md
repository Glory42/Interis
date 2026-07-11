---
name: codebase-cleanup
description: Removes dead code, unused imports, stale constants, and orphaned files from the Interis codebase. Use when the user says "clean up the codebase", "remove dead code", "/codebase-cleanup", or after deleting a feature or doing a big refactor.
---

# Codebase Cleanup — Interis

Safely removes code that is provably unused. Every deletion must be verified — do not remove something just because a grep returns zero hits if the export could be used dynamically or re-exported through an index file.

## Scope

Default: the changed files in the current diff, plus any files they import from. For a full-tree cleanup, use the `Explore` agent — say so explicitly so the user knows it will be thorough but slower.

---

## Cleanup areas

### 1. Unused TypeScript imports

In every changed `.ts` / `.tsx` file, look for imported names that are never referenced in the file body. These accumulate from refactors where the usage was removed but the import line wasn't.

Safe to remove if: the name appears in the `import` statement but not anywhere else in the file (including JSX props, type positions, and string references).

Run a targeted grep before removing: `grep -n "ImportedName" file.ts` — if only the import line hits, it's dead.

### 2. Unused exported constants and types

Grep for exported constants and types in `*/constants/*.ts` and `*/types/*.ts` files. For each export, check if it has any import anywhere in the project:

```bash
grep -rn "ImportName" apps/api/src apps/web/src --include="*.ts" --include="*.tsx"
```

Remove the export if the only hit is the definition itself. Do NOT remove if:
- It is re-exported from an index file
- It is used in a type-only position that TypeScript might inline away
- The file is in `apps/api/src/infrastructure/` (may be used by Drizzle internally)

### 3. Dead DTO schemas

In `*/dto/*.ts` files, look for Zod schemas that are exported but never imported (no `import { XxxSchema }` anywhere). These are often left over from removed endpoints. Safe to delete the schema and its inferred type.

### 4. Orphaned migration files

Check `apps/api/drizzle/` for `.sql` files that are not referenced in `apps/api/drizzle/meta/_journal.json`. These are migration files that were generated but never tracked — they won't run and clutter the directory.

```bash
# List .sql files in drizzle/
ls apps/api/drizzle/*.sql
# Compare against journal entries
grep '"tag"' apps/api/drizzle/meta/_journal.json
```

Flag any `.sql` file whose tag doesn't appear in the journal. Do not delete automatically — confirm with the user, as it might be an in-progress migration.

### 5. Commented-out code blocks

Grep for multi-line commented code blocks (`// ...` lines that look like old logic, not explanatory comments):

```bash
grep -n "^[[:space:]]*//" apps/api/src apps/web/src -r --include="*.ts" --include="*.tsx" | grep -v "TODO\|FIXME\|NOTE\|eslint\|prettier\|biome\| - "
```

Flag clusters of 3+ consecutive commented lines. Distinguish between:
- **Dead code** (old implementation, clearly replaced) → safe to remove
- **Explanatory comment** (describes why, not what) → keep

### 6. Unused route files (frontend)

In `apps/web/src/routes/`, find any `.tsx` file that is not referenced in `apps/web/src/routeTree.gen.ts`. These are route files that were created but never connected (possibly someone added a route file without running `bun run routes:generate`).

```bash
# List route files
find apps/web/src/routes -name "*.tsx" | sort

# Check routeTree.gen.ts for each
grep "routeTree" apps/web/src/routeTree.gen.ts | head -5
```

### 7. Stale feature flags or env-gated code

Search for any hardcoded `if (false)`, `if (process.env.NODE_ENV === "xxx" && false)`, or similar always-false branches. These are usually left from debugging sessions:

```bash
grep -rn "if (false\|if (0\|&& false" apps/api/src apps/web/src --include="*.ts" --include="*.tsx"
```

### 8. Console.log / debug statements

```bash
grep -rn "console\.log\|console\.warn\|console\.error\|debugger" apps/web/src --include="*.ts" --include="*.tsx" | grep -v "node_modules\|// "
```

Flag any `console.*` that isn't in an error boundary, a deliberate logging utility, or a backend error handler. These are usually debug statements left from development.

---

## Safety rules

Before removing anything:

1. **Grep first** — confirm zero usages outside the definition file.
2. **Check re-exports** — look for barrel `index.ts` files that might re-export the name.
3. **Don't touch `entities.ts`** — Drizzle uses the exported entity objects at runtime for query building; a zero-grep-hit doesn't mean it's safe to remove.
4. **Don't remove migration files** — even orphaned ones; confirm with the user first.
5. **One file at a time** — don't batch delete across unrelated modules in a single pass; stage and verify each module before moving to the next.

After cleanup, run:
```bash
# Backend
bun run typecheck    # from apps/api/

# Frontend
bun run typecheck    # from apps/web/
bun run lint
```

Zero new type errors and zero lint errors confirm the removals were safe.

---

## Report format (before making changes)

List every candidate removal grouped by category with file:line. For each:
- What it is
- Why it appears unused (zero grep hits / replaced by X / leftover from feature Y)
- Confidence: **Safe** (zero hits anywhere), **Likely** (no external hits but re-export possible), **Confirm** (needs user verification)

Only proceed with removals after the user has reviewed the report and confirmed.
