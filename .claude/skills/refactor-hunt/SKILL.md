---
name: refactor-hunt
description: Finds refactoring opportunities in Interis — duplicated logic, inconsistent patterns, premature abstraction, and helpers that belong in a shared layer. Use when the user says "find refactoring opportunities", "look for duplication", "/refactor-hunt", or after shipping several features in the same area.
---

# Refactor Hunt — Interis

Scans for code that would benefit from simplification, consolidation, or better placement in the layer hierarchy. This skill finds opportunities — it does not apply fixes unless explicitly asked.

## Scope

Default: the diff since the last tagged release or the modules the user names. For a broader hunt, use the `Explore` agent to search across the full `apps/api/src` and `apps/web/src` trees.

If the user says "hunt in serials" or names a specific feature, scope to that module's files.

---

## What to look for

### 1. Duplicated business logic across modules

Look for the same computation appearing in two or more service or helper files. Common patterns in this codebase:

- Episode/season filtering logic (`seasonNumber > 0`) duplicated across helpers
- Rating normalisation applied in multiple places instead of a shared helper
- `watchedDate` parsing (`T00:00:00` appended) done inline rather than always calling `parseDateOnly`
- Feed metadata construction repeated across `buildSerialDiaryEntryActivityMetadata` / `buildMovieDiaryEntryActivityMetadata`

Grep for structural similarity: same field access patterns, same guard expressions, same shape of return object. Flag the files and suggest where a shared helper would live (`commons/`, `media/helpers/`, or a module's own `helpers/` directory).

### 2. Repository methods that duplicate query logic

Look for two repository methods whose SQL is nearly identical, differing only in one `WHERE` clause predicate. Common: a `getAll*` method and a `getViewer*` method that share 80% of the same `.select()` / `.from()` / `.join()` chain. Flag candidates for a single method with an optional `viewerUserId` param.

### 3. Controller methods that do more than HTTP in/out

Per architecture rules, controllers should only validate input and call one service method. Flag any controller method that:
- Directly constructs complex objects before passing to the service
- Has conditional logic beyond input coercion/validation
- Calls more than one service method (service methods should compose sub-services, not controllers)

Reference: `CLAUDE.md` architecture section — controllers call service only.

### 4. Services that do repository work directly

Flag any `*.service.ts` file that imports `db` or uses Drizzle ORM operators directly instead of going through a repository. The only legitimate exception is `infrastructure/` layer files.

### 5. Helpers that belong in a shared location

Look for utility functions defined inside a module's `helpers/` that solve a generic problem:
- String formatting
- Date manipulation
- Pagination parameter parsing
- Rating normalisation / display

If the same pattern is used by two or more unrelated modules, the helper belongs in `src/commons/` (backend) or `src/lib/` (frontend).

### 6. Premature abstraction / over-engineered indirection

Flag cases where a service delegates to a sub-service that does only one trivially simple thing — a sub-service whose entire body is a single repository call with no logic. These add indirection without value and should be collapsed into the parent service or the repository call made directly.

### 7. Frontend: duplicate API call definitions

Look for `apiRequest<T>()` calls targeting the same backend route defined in more than one `api.ts` feature file. Each backend route should have exactly one frontend caller definition; everything else should import from it.

### 8. Frontend: inline query key strings

Look for `.useQuery({ queryKey: ["some-string", id] })` where the string literal is not coming from a `*Keys` factory object. The project convention is to export a `<feature>Keys` object from each hooks file. Inline strings get out of sync when a key is renamed.

### 9. Zod schemas defined twice

Check `apps/web/src/types/api.ts` (shared Zod schemas) against per-feature `api.ts` files. Flag any Zod schema that is defined identically in two places — it should live in `types/api.ts` and be imported from there.

### 10. Dead parameters

Look for function parameters that are accepted but never read in the function body (including repository methods where a parameter like `limit` is accepted but no `.limit()` is applied to the query). These create a false API contract.

---

## Report format

Group by category. For each finding:
- **File(s)** with line numbers
- **One-line description** of the duplication or smell
- **Suggested consolidation**: where the shared version should live and what it should look like (a function signature is enough — no need to write the full implementation)

Prioritise findings where consolidation removes the most lines or prevents the most future drift. Skip any finding that would require a cross-module circular import to fix — note those as "worth revisiting after restructuring" instead.

End with: "X consolidation opportunities found across Y categories."
