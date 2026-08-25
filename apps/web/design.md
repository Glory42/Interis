# Design — Interis

A locked design system for the Interis frontend. Every page redesign reads this
file before emitting code. Do not regenerate per page — extend or amend this
file when the system needs to grow.

## Special condition: color is NOT locked here

Interis ships a full user-facing multi-theme system (`public/theme-registry.js`
+ `src/index.css` `:root[data-theme-id="..."]` blocks — Rose Pine, NULL://LOG,
Tokyo Night, AMOLED, and more added over time). Themes are switched live by the
user and validated full-stack (see root `CLAUDE.md` → Theme system). This is a
product feature, not incidental styling.

**This design system does not own color here.** Every existing and future theme keeps
driving `--background`, `--foreground`, `--card`, `--primary`, `--accent`,
`--border`, `--muted`, `--destructive`, `--module-cinema`, `--module-serial`,
and the `--theme-*` decorative tokens (gradients, patterns, shadows, navbar,
modal, pill). Nothing in this file introduces a new palette or picks a single
anchor hue. Redesign work always references these existing semantic tokens —
never a raw hex/oklch value, and never a new color token that isn't theme-aware.

## Genre

**Editorial** — applied as structural discipline (hairlines over boxes,
asymmetric rhythm, restraint, no card-in-card, no decorative eyebrows) layered
on top of the app's existing atmospheric dark themes. The genre governs
layout/type/motion/component voice; it does not govern color.

## Macrostructure families

Interis is an application, not a marketing site. Most standard landing-page
macrostructure shapes assume a hero/CTA structure; only one family in this
app is a close fit today. The other two are sketched and will be refined
when we actually build those pages (amend this file, don't invent a new
system per page).

- **Browse/app pages** (Home Feed, Cinema index, Serials index, Search,
  Profile diary/reviews/lists/watchlist, Settings) → **Ecosystem Index**.
  Multiple discovery surfaces — rails, grids, filtered lists — each
  surfacing a different cut of content. No hero declaration. Divider
  language is **rail-titled bands** (a kicker label + hairline rule), never
  a bordered/boxed panel. "See more →" at a rail's edge, not a global CTA.
  **This is today's target family — see § Home Feed below.**
- **Detail pages** (Film/Serial/Review/Person detail) → sketch only, refine
  when built: a Photographic-led fold (poster/backdrop dominates the top)
  transitioning into a Long-Document-style body (synopsis, cast, reviews).
- **Auth pages** (Login, Register, Forgot password, Setup security
  question) → exempt from macrostructure. Minimal centered single-column
  form. Governed by spacing/type tokens only, no rail/hero apparatus.

## Typography

Preserved, not replaced — the existing pairing is already distinctive
(neither Inter nor Geist):

- Display: **Space Grotesk**, weight 700 (`--theme-display-font`)
- Body: **Sora**, weight 400 (`--theme-body-font`)
- Mono/kicker: **JetBrains Mono**, weight 700, tracking `0.18em`
  (`--theme-kicker-font`)

**Discipline tightened, not the fonts themselves:** the mono kicker is
reserved for genuine metadata — timestamps, tab labels, day dividers, module
badges (`CINEMA` / `SERIAL`). It is never used to fake a decorative section
eyebrow (`01 · FEATURES`) on a page that has no real ordinal structure.

Headings stay roman always (no italic display face) — global rule.

## Spacing

No parallel `tokens.css`. This is a Tailwind v4 project — the real token
system already lives in `src/index.css`'s `@theme inline` block and the
`:root` custom properties beneath it. New structural tokens (if any) extend
that block. Day-to-day spacing uses Tailwind's utility scale directly, per
existing project convention — but applied with the layout-and-space
discipline: vary gaps deliberately, avoid identical padding on every
container, prefer hairline dividers (`border-b border-border/40`,
`divide-y divide-border/40`) over repeated boxed panels for anything that
isn't a discrete content card.

## Motion

Unchanged. One quiet orchestrated entrance (`animate-fade-up`,
`animate-route-enter` keyframes already in `index.css`). No new motion
library. Respect `prefers-reduced-motion`. Focus rings appear instantly,
never transitioned in.

## Microinteractions stance

- Silent success (no toast for actions the user can already see happened).
- Optimistic like/unlike, no confirmation dialogs for reversible actions.
- Hover delay implicit (CSS `:hover`, not JS tooltips) — no timing to set here.
- Focus-visible ring on every interactive element, instant, ≥3:1 contrast.

## CTA voice

- Primary action: filled `Button` (shadcn/ui `Button` component, existing
  `theme-button-primary` shadow token) — unchanged.
- Rail-edge secondary action: typographic link, `"See more →"`, no border,
  no fill — new pattern introduced by the Ecosystem Index family.
- Destructive: existing `theme-button-danger` treatment — unchanged.

## Component voice — what's changing

The current flatness (three sidebar-style panels — two trending rails and
the composer — all sharing the identical `rounded-2xl border bg-card/40 p-5`
box) is the main "templated" tell on Home Feed, not color or type. The feed
column itself already uses hairline dividers correctly (`FeedActivityCard`,
`PostActivityCard`, `ReviewActivityCard` — border-transparent → hover
border, no box). The fix is to bring the rails in line with the feed's own
voice, not to introduce a new one.

## What pages MUST share

- The wordmark, mark, and nav/footer chrome (unchanged this pass).
- The Space Grotesk / Sora / JetBrains Mono pairing.
- The per-theme semantic color tokens — no page invents its own color.
- Hairline-first component voice: a bordered box is reserved for a discrete
  piece of content (a social-activity card, a movie preview), never for a
  structural container (sidebar, composer shell, rail).
- The CTA voice above.

## What pages MAY differ on

- Macrostructure within their family (browse pages can vary rail count/type;
  detail pages get their own shape once built).
- Section/rail archetype chosen from the component cookbook.
- Enrichment — browse pages are typography+imagery only (posters/thumbnails
  already carry the visual weight); no additional enrichment tier needed.

## Home Feed (first page — Ecosystem Index family)

- **Nav:** kept the N1b-shaped bar structurally (brand · primary links ·
  search · notifications · profile) — correct for an authenticated app
  shell. Chrome refined: the notification bell, profile-menu trigger, and
  mobile-menu toggle previously carried a *permanent* bordered-pill outline
  on every icon button — the one place on the page still using boxed chrome
  by default. Brought in line with the hairline-first rule: no permanent
  border, hover reveals a soft `bg-foreground/[0.06]` tint, explicit
  `focus-visible:ring-2 ring-ring/60` preserved/added for keyboard users.
  The sliding active-tab indicator is unchanged (bespoke, not boxed chrome —
  `FeedFilterTabs` was rebuilt to reuse this exact idea instead of a boxed
  segment-shell). Bar height increased `h-12` → `h-14` for breathing room
  now that the rest of the page reads lighter; checked against every sticky
  offset that assumes nav height (`HomePage` asides, `AdminSidebarNav` both
  use `top-16`, which still clears a 56px bar with margin) and the mobile
  overlay's hardcoded top offset, updated to match.
- **Footer:** kept as the existing single-row Ft2-shaped footer. Untouched
  this pass.
- **Rails (`TrendingNowRail`, `TrendingAmongUsersRail`):** de-boxed. Rail
  title becomes a kicker + hairline rule (rail-titled band), list items
  divided by hairlines instead of living inside a shared bordered/bg-card
  panel.
- **Composer (`QuickLogComposer`):** lightened — loses the boxed-panel
  treatment, sits directly at the top of the feed column with a hairline
  rule beneath it separating it from the activity stream, matching the
  feed's own visual grammar instead of looking like a fourth sidebar widget.
- **Feed cards (`FeedActivityCard`, `PostActivityCard`,
  `ReviewActivityCard`, `FeedActivityList`):** the cards already used
  hairline dividers, but each one also grew a *full bordered box on hover*
  (`hover:border-border/60`) — a box appearing from nowhere on interaction,
  which is the same tell as a permanent box, just deferred. Removed. The
  hairline divider between cards now lives once on the list wrapper
  (`divide-y divide-border/40`, mirrored on the loading skeleton), and hover
  is a plain background tint — no border ever appears or disappears.
