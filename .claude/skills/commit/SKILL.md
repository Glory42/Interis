---
name: commit
description: Commit code changes with conventional commit messages using Interis project scopes. Use when the user says "commit", "commit this", "save changes", or "/commit". ALWAYS use this skill for commits — never add Co-Authored-By lines.
---

# Conventional Commit Skill — Interis

Create git commits following Conventional Commits with project-specific domain scopes.

## Commit Format

```
<type>(<scope>): <description>

<optional body>
```

## Types

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructuring without behavior change |
| `style` | CSS, Tailwind, visual changes — no logic change |
| `chore` | Build config, dependencies, tooling, cleanup |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `docs` | Documentation only |

## Domain Scopes

| Scope | Covers |
|-------|--------|
| `diary` | Watch log CRUD — `apps/api/src/modules/diary/`, `apps/web/src/features/diary/` |
| `interactions` | Per-movie like / watchlist / rating state — `modules/interactions/`, `features/interactions/` |
| `reviews` | Reviews, comments, likes — `modules/reviews/`, `features/reviews/` |
| `posts` | Short posts with comments/likes — `modules/posts/`, `features/posts/` |
| `feed` | Social feed assembly and display — `modules/social/`, `features/feed/` |
| `social` | Follow graph, activity insertion — `modules/social/` |
| `films` | Movie search, detail, archive, cinema pages — `modules/movies/`, `features/films/` |
| `serials` | TV series search, detail, archive, season/episode tracking — `modules/serials/`, `features/serials/` |
| `profile` | Public profile pages, tabs, top picks — `modules/users/`, `features/profile/` |
| `public` | Rate-limited widget endpoints — `modules/public/`, `features/public/` |
| `auth` | Authentication, sessions, guards — `infrastructure/auth/`, `features/auth/` |
| `users` | Account management, themes, settings — `modules/users/`, `features/users/` |
| `people` | Director/actor pages — `modules/people/`, `features/people/` |
| `lists` | User-curated lists — `modules/lists/`, `features/lists/` |
| `uploads` | Signed R2 upload flow — `modules/uploads/`, `features/uploads/` |
| `rating` | Rating scale, display components — `SpaceRating`, `DiaryRatingStars`, rating utils |
| `ui` | Shared Radix/shadcn primitives — `apps/web/src/components/ui/` |
| `db` | Drizzle schema, migrations — `apps/api/src/infrastructure/database/`, `apps/api/drizzle/` |
| `api` | Cross-cutting backend changes — `src/index.ts`, middleware, commons |
| `web` | Cross-cutting frontend changes — routing, query client, api-client |
| `docs` | Public API documentation — `apps/docs/` |
| `config` | Build config, tsconfig, drizzle.config, vite.config |
| `e2e` | Playwright smoke tests — `apps/e2e/` |

If changes span multiple areas, use the primary one. For broad cross-cutting changes, omit the scope.

## Rules

1. **Description**: lowercase, imperative mood, no period. Max 72 chars.
2. **Body**: recommended for non-trivial commits — explain *why*, not what.
3. **No Co-Authored-By**: Never add co-author lines.
4. **Scope from diff**: Always read `git diff --staged` to determine the correct scope.
5. **One concern per commit**: If changes touch unrelated areas, split into separate commits.
6. **Specific files**: Stage with `git add <specific files>`, never `git add .` or `git add -A`.
7. **docs/ check**: If the diff changes a public API route, DB schema, or feed metadata shape, check the relevant file in `apps/docs/src/content/docs/` and update it if it's now out of date. Stage the updated doc alongside the other files.
8. **Migration check**: If a Drizzle entity changed, confirm a migration was generated (`bunx drizzle-kit generate`) before committing the schema file.

## Workflow

1. `git status` — see what changed
2. `git diff --staged` (or `git diff` if nothing staged) — understand the change
3. `git log --oneline -5` — match recent commit style
4. Determine type + scope from the diff
5. Stage relevant files: `git add <specific files>`
6. Commit with heredoc:

```bash
git commit -m "$(cat <<'EOF'
type(scope): description

Optional body explaining why.
EOF
)"
```

## Examples

```
feat(diary): add rewatch toggle and like button to log film modal
fix(feed): guard non-uuid diary_entry entity ids in review context builder
refactor(serials): replace SeasonEpisodeReviewDialog with shared LogMediaDialog
feat(rating): replace ratingOutOfFive with real 0.5-10 scale across all modules
fix(serials): include mediaSource in onConflictDoUpdate target for season reviews
feat(social): emit liked_movie activity when user likes a serial season
style(ui): tighten spacing on FeedActivityCard poster thumbnail
chore(db): add serial_season_interactions migration
docs(public): document season/episode feed activity metadata shape
fix(profile): resolve tv_season and tv_episode review detail by mediaSourceId
feat(public): add serials-progress endpoint to public widget API
refactor(feed): extract toSeasonEpisodeLabel helper in FeedActivityCard
```
