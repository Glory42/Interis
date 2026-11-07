# Interis redesign: implementation plan

This plan turns the design review in `docs/design-review/*.html` into shippable work. It has three tracks:

- **Track A, backend:** fix what's broken, then add the data the new pages need.
- **Track B, design foundation:** themes, tokens and shared components. It doesn't depend on Track A, so it runs in parallel.
- **Track C, pages:** each page is rebuilt for desktop and phone browser at the same time.

Every item below is sized as **one pull request** (PR-xx). Phases are the order of work, not deadlines.

**Status (2026-11-07): all 46 PRs have shipped** (GitHub #142–#221, then a polish pass in #222). Still open: people search (deferred in PR-13) and the reversible "hide" for admin content (D5). The TMDB credit (PR-06, PR-31) ended up on the Developer page, not the footer.

---

## 0. Decisions to confirm before starting

| # | Decision | Recommendation | Affects |
|---|---|---|---|
| D1 | Navbar labels: "Films / TV" or "Films / Series" | **Films / TV**. It's shorter and matches "Trending Shows" on the landing page. | B6, every page |
| D2 | Bottom tab bar on phones | **Yes**, with a ✎ Log button in the centre. It replaces the ☰ menu on phones only. | B6, C4 |
| D3 | Opening a TV season on phones | **A separate route** `/serials/$tmdbId/season/$n`, so each season gets a shareable link and long seasons aren't expanded inline. Desktop keeps the inline list. | C3 |
| D4 | Rose Pine palette | **Use the real Rosé Pine palette**, since that's what the name promises. | B1 |
| D5 | Removing content in admin | **Delete with a reason now**. A reversible "hide" comes later (P3), because every public read would need a new filter. | A2 |
| D6 | Admin password reset | **Replace "admin types a new password"** with "force reset". Until force reset ships (PR-21), require the admin's own password. | A0, A2 |

---

## 1. Ground rules for every PR

**Backend (from `CLAUDE.md`):**
- **Module layout:** controller → service → repository. Every handler is wrapped in `asyncHandler`. `bun run lint:arch` must pass.
- **Migrations:** run `bunx drizzle-kit generate` then `bun run scripts/docker-migrate.ts`. Use the local Postgres only, never Neon. Every new table or column used in a WHERE or JOIN gets an `index()`.
- **Performance:**
  - no polling
  - no database writes from GET handlers
  - every list endpoint bounded and paginated
  - independent queries via `Promise.all`
  - no N+1 queries (collect the ids, then one `inArray` query)
  - TMDB reads go through `createCachedTmdbFetcher`
- **Tests:** add or extend integration tests (`bun test`), with `DIRECT_DATABASE_URL` pointing at local Postgres.

**Frontend:**
- Run `bun run typecheck`, `bun run lint` and `bun run test`. Run `bun run routes:generate` after adding or renaming routes.
- Mutations invalidate only the query keys they change. Don't copy props into state with `useEffect` + `setState`. Wrap list items in `React.memo` where a page also has unrelated state.

**Every PR:**
- Run the `performance-check` skill before calling it done.
- Commit with the `commit` skill: conventional commits, no co-author lines.
- Visually check the result in the default theme, null-log and Marquee, at 1280px and 390px.

---

## 2. Track A: backend

### Phase 1. Fix what's broken (A0)

These are security, correctness and performance bugs. They're independent of the redesign, so they ship first. PR-06 bundles the small frontend-only fixes.

**PR-01 · Admin account actions require the admin's password** (security)
- **Problem:** `POST /admin/users/:username/reset-password` only takes `newPassword` (`admin.dto.ts:11`). The admin never re-enters their own password, and the action is offered on the admin's own row. A hijacked admin session could take over any account.
- **Change:**
  - Add `adminPassword` to the reset, suspend, role-change and delete schemas, and verify it in the service.
  - Rate-limit failed password checks.
  - The server refuses these actions when the target is the admin themselves; the frontend hides them on their own row.
  - Change the reset field to `type=password` with `autocomplete=new-password`.
- **Tests:**
  - wrong password returns 401
  - an admin acting on themselves returns 400
  - the rate limit trips after N failures

**PR-02 · Paginate every admin list**
- **Problem:** `features/admin/api.ts` never sends `limit` or `offset`, so only the newest 20 rows are reachable. Report #21 can't be seen.
- **Change:**
  - Server: a default and maximum `limit` on every admin list, plus `offset`, with cursors for reports.
  - Frontend: "Older →" controls.
  - The current section and filters go into the URL, e.g. `/admin/reports?status=pending`.
- **Tests:** pages beyond the first 20 rows; the limit cap.

**PR-03 · Removing content resolves every report on it**
- **Problem:** "remove" closes only the report that was clicked (`reports.service.ts:74`). Other pending reports on the deleted item stay open.
- **Change:** in one transaction, delete the content and resolve every pending report with the same target type and id.
- **Tests:** three reports on one review → remove → all three resolved.

**PR-04 · Paginate the blocked and muted lists**
- **Problem:** `/api/moderation/blocked` and `/muted` return everything.
- **Change:** default limit 25, cursor on `(createdAt, id)`, frontend "Load more".

**PR-05 · Person pages: correct, complete and cached**
- **Problems:**
  - Credits are silently cut to 120 combined and 100 per type (`people-credit-normalization.service.ts:18-19,197,246`).
  - The duplicate check includes the job, so a title appears once per job.
  - Each view makes 6 uncached TMDB calls, with details awaited before the rest (`people-detail.service.ts:31,36`).
  - The response is sent with `Cache-Control: no-store` (`people.controller.ts:34`).
- **Change:**
  - Wrap the TMDB calls in `createCachedTmdbFetcher`, keyed by person id, and run them in one `Promise.all`.
  - Build the film and TV lists from the combined credits call.
  - One crew row per title, with a `jobs[]` array; return `jobCounts` across all credits.
  - Paginate credits (`job`, `media`, `order`, `limit=40`, `offset`) and return a `total`.
  - Allow a short public cache.
- **Tests:**
  - no duplicate titles
  - `total` matches the source
  - a second request hits the cache (mock the TMDB fetcher)

**PR-06 · Quick frontend fixes** (one small PR)
- **Sign-up and sign-in forms:**
  - `RegisterForm.tsx:70`: the username field is marked `autoComplete="username"`, so password managers save the handle instead of the email. Give the email field `autocomplete=username`, and set the handle to `off`.
  - `LoginForm.tsx:312`: remove `minLength=8`, which makes the browser show its own error before the server answers.
- **Wrong links:** person breadcrumbs point at the wrong lists (`PersonDetailPage.tsx:101-106`).
- **Archive:** "Load more" can produce a duplicate React key. Remove duplicates by `tmdbId` when merging pages.
- **Wrong or missing text:**
  - The footer needs the TMDB credit that TMDB's terms require.
  - The recovery-question copy says it's needed to change your email (`SetupSecurityQuestionForm.tsx:363`); email changes actually use the password.
  - "1 logs" should read "1 log".
  - The Reviews heading counts only the loaded page; use `profile.stats.reviewCount`.

**PR-07 · Diary "liked" mark for every entry**
- **Problem:** ♥ in the diary only checks the first 60 liked movies (`ProfileDiaryPage.tsx:21-30`), so liked series never show.
- **Change:** each diary item comes back with `liked: boolean` from one batch lookup; the frontend stops cross-referencing.

**PR-08 · Real totals and server-side type filters for Likes and Watchlist**
- **Problem:** the counts and the film/TV filter only cover the pages already loaded.
- **Change:** add `type` and `sort` parameters, and return `total`.

### Phase 2. Data the new pages need (A1)

**PR-09 · Viewer status lookup** (reused by several pages)
- **What:** one service and endpoint. You send up to 60 `{mediaType, tmdbId}` pairs and get back, for the signed-in user: watched, rating, liked, on watchlist, and episodes watched out of total.
- **How:** sign-in is optional; it's one `inArray` query per table, combined into a Map.
- **Used by:** search (C7), person pages (C8), list detail (C6) and poster-card marks (B5).

**PR-10 · Grouped activity for the feed and profile**
- **What:** at read time, merge a person's activities on the same title on the same day into one item: watched, rating, liked, rewatch and a review excerpt. Hide likes on your own content.
- **How:** read N raw activity rows with the existing cursor, group them, and return the cursor of the last raw row. A page can come back with fewer items, which is fine. No schema change.
- **Tests:**
  - log + rate + like + review on the same day becomes one item
  - paging across a group boundary doesn't duplicate or drop anything

**PR-11 · TV progress: seasons, next up, mark up to here**
- **What:**
  - watched and total episodes per season
  - the next unwatched episode for "Next up"
  - `POST /serials/:id/seasons/:n/watched-through/:episode`, which marks every earlier episode watched in one batched insert
- **Note:** season and episode ratings already use 0.5–10, so the rocket input there is frontend-only.

**PR-12 · Profile stats additions**
- **What:** average rating, number of rated logs, hours watched, and logs per week for the current year (52 values).
- **How:** computed on request with `Promise.all`, no stored rollup. Empty months are filled in on the frontend.

**PR-13 · Search adds director/creator and your status**
- **Director or creator:** filled only from detail rows already cached; no new TMDB call per result. If a title isn't cached yet, the field is left out.
- **Your status:** comes from PR-09.
- **Film/TV split:** done on the frontend, since the API already returns `mediaType`.
- **People search:** a cached TMDB `/search/person` call. It's deferred until person search ships.

**PR-14 · Person page additions**
- `knownFor`: the top 8 credits by `voteCount`, including backdrops.
- `biographySource`: the trailing Wikipedia/CC-BY-SA sentence split out of the biography.

**PR-15 · List detail additions**
- Each item gets the owner's rating and the director or creator, filled in one batch query.

**PR-16 · Theme ids: Tokyo Night becomes Nitrate**
- **Change:**
  - Add `nitrate` to `users/constants/theme.constants.ts`.
  - A data migration runs `UPDATE "profile" SET theme='nitrate' WHERE theme='tokyo-night'` (`apps/api/drizzle/0061_nitrate_theme.sql`).
  - Remove `tokyo-night` from the list.
- **Order:** ship together with B1, which adds the frontend fallback for unknown theme ids.

### Phase 6. Admin console backend (A2)

Admin also needs PR-01 and PR-02 from Phase 1. Mockup: `admin.html`.

**P1**
- **PR-17 · Audit log**
  - **Table:** new `admin_audit_log` with these columns:
    - `actor_id` (set to NULL if that admin is deleted) and `actor_username`
    - `action`, `target_type`, `target_id`, `target_label`
    - `reason`, `created_at`
  - **Indexes:** `(created_at, id)`, `(actor_id, created_at)` and `(target_type, target_id)`.
  - **Writes:** every admin POST, PUT and DELETE writes its row in the same transaction as the action.
  - **Reading:** a read-only, cursor-paged endpoint.
- **PR-18 · Reports grouped by item**
  - **Endpoint:** returns one row per reported item, with report count, reasons, author and age of the oldest report.
  - **Actions:** "resolve all" and "dismiss all", with an optional note.
  - **Migration:** add `resolution_action` and `resolution_note` to reports, plus an index on `(target_type, target_id)`.

**P2**
- **PR-19 · User detail page**
  - Search by username or email, with `%` and `_` escaped.
  - Activity counts computed with `Promise.all`, plus the list of active sessions.
  - A "revoke sessions" action.
- **PR-20 · Suspensions that end**
  - **Migration:** add `suspended_until` and `suspended_by`.
  - **Expiry:** `requireAuth` treats a suspension that has ended as lifted, without writing to the database.
- **PR-21 · Force password reset**
  - **Migration:** add a `must_change_password` flag.
  - **Behaviour:** revoke the user's sessions and send them through the existing security-question reset flow.
  - **Missing question:** decided: accounts without a recovery question get a 409 instead of being locked out.
- **PR-22 · Overview numbers**
  - `GET /admin/overview` runs about 8 counts with `Promise.all`, only when the page opens or Refresh is pressed.
  - If it gets slow, keep the result in memory for 5 minutes. Never add a timer or a stored rollup.

**P3**
- **PR-23 · Comments and lists can be reported:** extend `report_target_type`, and add an admin list and delete for comments.
- **PR-24 · Take down content with a reason:** the reason is written to the audit log, with an optional notice to the author.
- **PR-25 · Cache tools:**
  - refresh the oldest 25 cached titles (add an index on `cached_at`)
  - purge cached titles nothing references: a count first, then the admin's password, then deletes in batches of 500
  - counts since the server started, held in memory

---

## 3. Track B: design foundation (frontend, runs alongside Track A)

**PR-26 · B1 Themes in one place**
- **Mockup:** `themes.html`
- **Single source:** all theme colours live only in `index.css` under `:root[data-theme-id]`. The startup script in `index.html` only sets `data-theme-id`, plus `color-scheme` for Marquee, and falls back to the default for unknown ids. `theme-registry.js` keeps only the id, label, description and preview swatches.
- **Colour roles:** every theme defines the same roles:
  - `bg`, `surface`, `raised`
  - `fg`, `muted`, `faint`
  - `line`, `line-strong`
  - `primary`, `primary-foreground`
  - `film`, `series`
  - `like`, `danger`, `warning`, `success`
  - `slate`, `grain`, display font
- **New values:** Rose Pine (the real palette), NULL://LOG (amber for films), **Nitrate** (new) and Marquee.
- **Remove:**
  - the per-theme radius
  - glow shadows
  - the shell gradient, pattern and vignette
  - the modal gradient and pattern tokens
  - the unused `.theme-nav-pill-*`, `.theme-segment-*` and `.theme-menu-item-active` classes
- **Also:**
  - `::selection` uses the primary colour and its text colour.
  - The `profile-shell-*`, `settings-shell-*` and `developer-shell-*` sets collapse into one `.shell*` set plus `.surface`.
- **Test:** a vitest check that every text role in every theme reaches at least 4.5:1 contrast on `bg` and `surface`.
- **Docs:** update `ADDING-THEMES.md` and the `add-theme` skill for the role list.

**PR-27 · B2 Type and radius**
- **Fonts:**
  - Space Grotesk for titles
  - Sora for body text
  - JetBrains Mono only for numbers and metadata
  - Instrument Serif (new) for taglines and review quotes
  - Playfair Display for Marquee titles
- **Type scale:** display 1–4, body, body-small, caption (11px minimum), mono-number, mono-meta and kicker, defined as utilities.
- **Radius:** `--radius: 3px`, with fixed steps of 2, 3 and 4px.
- **Rollout:** replace the inline `font-mono uppercase tracking-[…]` strings (113 of them) with `.kicker` as each page is rebuilt, not all at once.

**PR-28 · B3 Basic controls**
- **Buttons and badges:**
  - `Button` gets primary, secondary, ghost, danger, link and icon variants, plus a loading state shown with reel ticks.
  - `Badge` gets tone variants.
- **Fields:** `Input` and `Textarea` use 16px text below 640px, show an error state and have a character-counter slot. `Checkbox` and `Switch` are squared.
- **Navigation controls:** `Tabs` (with counts), `Segmented` and `Chip`.
- **Sentence filters and menus:** `SentenceFilter` phrases each open the existing menu. `Menu` and popovers use hairline borders with no blur.
- **Remove `ui/card.tsx`:** its 13 users move to `.surface`.

**PR-29 · B4 Overlays and feedback**
- **ModalShell** gets `layout: dialog | sheet | fullscreen`. It keeps the custom modal pattern from `CLAUDE.md`.
- **Sheets on phones** cover only the lower part of the screen, with the dimming only behind them. The page stays visible above.
- **ModalHeader** becomes a slate bar.
- **ConfirmDialog** has one layout and a `requirePassword` option.
- **Toaster** gets tones and an action slot (for Undo), and sits above the sticky bar on phones.
- **Loading and empty states:** `TickLoader` replaces `Spinner` and `Loader2` in 22 files. `Skeleton` gets shape presets. One `EmptyState` with visitor and owner variants, plus an `ErrorState`.

**PR-30 · B5 Film-specific components**
- **Slates and credits:** `Slate`, `CreditsList` (dotted leaders, rows with no value dropped) and `OutlinedRank`.
- **`PosterCard`:**
  - sizes L, M, S and XS
  - marks for watched, liked and your score, filled from PR-09
  - a typeset title when there's no poster
  - wrapped in `memo`
- **Rocket rating:**
  - `RocketDisplay`: the restyled `SpaceRatingDisplay`.
  - `LaunchTrack`: `SpaceRatingInput` turned horizontal. It saves when you let go, has no Save button, moves 0.5 per arrow key and uses `role=slider`.
  - `RatingSelect`: the star dropdown becomes a small rocket input.
- **Episode progress:** `ReelCells` draws one cell per episode.
- **`DuotoneBackdrop`:** grayscale image, film/TV tint and grain, plus each theme's signature touch (NULL://LOG scanlines, Nitrate sprocket edges). It replaces `PosterWallBackdrop` and `RotatingPosterBackdrop`'s overlays.

**PR-31 · B6 App shell**
- **Desktop navbar:** a flat bar labelled Feed, Films and TV, with the active link underlined in its film or TV colour, and search on `/` or ⌘K.
- **Phone navigation:** a 44px top bar, with the ☰ dropdown replaced by a bottom sheet, or by the bottom tab bar if D2 is yes. Detail pages hide the tab bar so their own sticky bar can use the space.
- **Footer:** one slate line with the TMDB credit.
- **`PageWrapper`:** titles use the display font.
- **404:** the "Cut to black." page from `landing-search-dev.html`.

---

## 4. Track C: pages

Each page ships desktop and phone browser together. The mockups are the spec.

**Phase 3**

| PR | Page | Mockup | Needs |
|---|---|---|---|
| PR-32 | **Film and TV detail pages**: letterboxed hero, credits block, tagline, "Watched Nov 2 · Log again", launch track, no "Unknown"; on phones the title on the first screen, a sticky action bar and a rating sheet | `film-language.html` §1, `film-language-mobile.html` §1 | B1–B5 (watch date already in the API) |
| PR-33 | **Log / review**: desktop modal, full-screen on phones, top-right Save, spoiler bar above the keyboard, native date picker, saved drafts | `log-review.html` | B4, B5 |
| PR-34 | **Seasons and episodes**: progress strip per season, compact episode rows, ⋯ episode sheet, Next up, mark up to here, rocket ratings | `film-language*.html` §2 | PR-11, B5, D3 |
| PR-35 | **Films / TV archive**: spotlight hero (duotone, slates, filter sentence), poster grid | `archive-hero-v2.html` | B5 |

**Phase 4**

| PR | Page | Mockup | Needs |
|---|---|---|---|
| PR-36 | **Feed**: one card per watch, slate date dividers, Now showing, Your week, composer, phone tab bar | `film-language*.html` §3, `signed-in.html` A | PR-10, PR-12, B6 |
| PR-37 | **Profile header and Overview**: visitor/owner empty states, Follow button, scrollable tabs on phones | `profile.html` §1–2, §10 | PR-10 |
| PR-38 | **Profile Diary and Watching** | `profile.html` §3–4 | PR-07, PR-11 |
| PR-39 | **Profile Reviews, Likes, Watchlist, Lists and list detail** | `profile.html` §5–7 | PR-08, PR-15 |
| PR-40 | **Review detail and Stats** | `profile.html` §8–9 | PR-12 |
| PR-41 | **⌘K search**: sections, recent searches, keyboard navigation, full screen on phones | `landing-search-dev.html` §2 | PR-09, PR-13 |
| PR-42 | **Person pages** | `people.html` | PR-05, PR-09, PR-14 |

**Phase 5**

| PR | Page | Mockup | Needs |
|---|---|---|---|
| PR-43 | **Settings**: side navigation on desktop, list on phones, theme tiles with live previews, reorderable top 4, one account form at a time, replace recovery question, delete inside a danger zone | `settings-auth.html` §1–5 | PR-26 |
| PR-44 | **Sign in, join, recover, set recovery question** | `settings-auth.html` §6 | PR-06 |
| PR-45 | **Guest landing and developer page** | `landing-search-dev.html` §1, §3 | B5 |

**Phase 6**

| PR | Page | Mockup | Needs |
|---|---|---|---|
| PR-46 | **Admin console**: overview, grouped reports, user detail, content, audit log, cache tools, phone triage | `admin.html` | PR-17 to PR-25 |

---

## 5. Order of work

| Phase | Track A (backend) | Track B / C (frontend) | Status |
|---|---|---|---|
| 1 | PR-01–05, 07, 08 | PR-06, PR-26 (themes) together with PR-16, PR-27 | Shipped |
| 2 | PR-09–15 | PR-28–31 | Shipped |
| 3 | PR-17–18 (admin P1) | PR-32–35 | Shipped |
| 4 | PR-19–22 (admin P2) | PR-36–42 | Shipped |
| 5 | PR-23–25 (admin P3) | PR-43–45 | Shipped |
| 6 | | PR-46 | Shipped |

The first useful milestone is the end of Phase 3. By then the security holes are closed, the themes are fixed, and the film/TV page, logging and seasons all have the new design. Those are the screens people use most.

---

## 6. Risks

- **Grouped activity and paging (PR-10):** pages can come back shorter than usual. Show a "Load more" row instead of assuming a fixed page size.
- **Removing old styles (B):** taking out the old shell classes and glows touches many files. Do it in PR-26/27, with screenshots of every theme at 1280px and 390px before merging.
- **Theme migration (PR-16):** the frontend fallback for unknown theme ids must ship before or with the data migration, so nobody sees an unstyled page.
- **Bar above the keyboard on phones (PR-33):** browsers report the keyboard inconsistently. If it can't be positioned, the bar stays in the page flow instead of sticking above the keyboard.
- **Neon free tier:** don't add polling or timers anywhere, including the admin overview. Admin refreshes when the page regains focus or when Refresh is pressed.
