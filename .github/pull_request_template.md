## Summary

<!-- What does this PR change, and why? -->

Closes #

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor (no behavior change)
- [ ] Performance
- [ ] Docs / tooling / CI

## Screenshots

<!-- Before/after for UI changes. Check at least one dark and one light theme. Delete if not applicable. -->

## Database

- [ ] No schema change
- [ ] Schema change — migration generated with `bunx drizzle-kit generate` and included

## Checklist

- [ ] `bun run typecheck && bun run lint && bun run lint:arch && bun run test && bun run build` passes from the repo root
- [ ] New or changed API contracts are validated with Zod on both sides
- [ ] New routes have the right auth guard (`requireAuth` / `requireAdmin` / public)
- [ ] New list endpoints are paginated, and mutations invalidate only the queries that changed
- [ ] GET handlers don't write to the DB; no new polling (`refetchInterval`) against DB-backed endpoints
- [ ] Environment variable changes are documented in `.env.example`
- [ ] Docs updated (`README.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `CONTEXT.md`, ADRs) where relevant

## Notes for reviewers

<!-- Anything worth calling out: trade-offs, follow-ups, areas you're unsure about. -->
