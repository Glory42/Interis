# Design — Interis

A locked design system for the Interis frontend. Every page redesign reads this
file before emitting code. Do not regenerate per page — extend or amend this
file when the system needs to grow.

## Special condition: color is NOT locked here

Interis ships a full user-facing multi-theme system (`public/theme-registry.js`
+ `src/index.css` `:root[data-theme-id="..."]` blocks — Rose Pine, NULL://LOG,
Nitrate and Marquee). Themes are switched live by the
user and validated full-stack (see root `CLAUDE.md` → Theme system). This is a
product feature, not incidental styling.

**This design system does not own color here.** Every existing and future theme keeps
driving the shared roles (`--bg`, `--surface`, `--raised`, `--fg`,
`--muted-foreground`, `--faint`, `--line`, `--line-strong`, `--primary`,
`--film`, `--series`, `--like`, `--danger`, `--warning`, `--success`,
`--grain`), the library names derived from them (`--background`, `--card`,
`--border`, `--muted`, `--destructive`, `--module-movie`, `--module-serial`, …)
and the `--theme-*` tokens (hero gradient and pattern, navbar, modal, fonts).
`--slate` (black) is the one shared non-theme colour. Nothing in this file
introduces a new palette or picks a single anchor hue. Redesign work always
references these existing semantic tokens — never a raw hex/oklch value, and
never a new color token that isn't theme-aware.

## Genre

**Editorial** — applied as structural discipline (hairlines over boxes,
asymmetric rhythm, restraint, no card-in-card, no decorative eyebrows) layered
on top of the app's three dark themes and the light Marquee theme, with the
reel/slate film vocabulary (`.slate` strips, duotone backdrops, rockets) from
`docs/design-review/`. The genre governs
layout/type/motion/component voice; it does not govern color.

## Macrostructure families

Interis is an application, not a marketing site. Most standard landing-page
macrostructure shapes assume a hero/CTA structure; three families cover the
app (amend this file, don't invent a new system per page).

- **Browse/app pages** (Home Feed, Films index, TV index, Search,
  Profile diary/reviews/lists/watchlist, Settings) → **Ecosystem Index**.
  Multiple discovery surfaces — rails, grids, filtered lists — each
  surfacing a different cut of content. No hero declaration. Divider
  language is **rail-titled bands** (a kicker label + hairline rule), never
  a bordered/boxed panel. "See more →" at a rail's edge, not a global CTA.
  **This is today's target family — see § Home Feed below.**
- **Detail pages** (Film/Series/Review/Person detail) → a Photographic-led
  fold (`LetterboxHero`: slate strip over a letterboxed backdrop) transitioning
  into a Long-Document-style body (credits, synopsis, cast, reviews).
- **Auth pages** (Login, Register, Forgot password, Setup security
  question) → exempt from macrostructure. A single form column inside one
  shared reel frame (`AuthShell`: slate header with a trending strip), no
  rail/hero apparatus.

## Typography

Preserved, not replaced — the existing pairing is already distinctive
(neither Inter nor Geist):

- Display: **Space Grotesk**, weight 600–700 (`--theme-display-font`;
  Marquee swaps in **Playfair Display**)
- Body: **Sora**, weight 400 (`--theme-body-font`)
- Mono: **JetBrains Mono** (`--theme-kicker-font`), for numbers and metadata
  only
- Serif: **Instrument Serif** italic (`.tagline`), for taglines and review
  quotes only

The scale is a set of utilities in `index.css`: `.display-1`–`.display-4`,
`.body`, `.body-s`, `.caption` (11px, the floor), `.mono-num`, `.mono-meta`
and `.kicker` (10px, weight 600, tracking `0.12em`, uppercase).

**Discipline tightened, not the fonts themselves:** the mono kicker is
reserved for genuine metadata — timestamps, tab labels, day dividers, module
badges (`Film` / `TV`). It is never used to fake a decorative section
eyebrow (`01 · FEATURES`) on a page that has no real ordinal structure.

Headings stay roman always (no italic display face) — global rule. Corners
are 2–4px everywhere (`--radius: 3px`); `rounded-full` is for avatars and
dots.

## Spacing

No parallel `tokens.css`. This is a Tailwind v4 project — the real token
system already lives in `src/index.css`'s `@theme inline` block and the
`:root` custom properties beneath it. New structural tokens (if any) extend
that block. Day-to-day spacing uses Tailwind's utility scale directly, per
existing project convention — but applied with the layout-and-space
discipline: vary gaps deliberately, avoid identical padding on every
container, prefer hairline dividers (`border-b border-[color:var(--line)]`,
`divide-y divide-[color:var(--line)]`) over repeated boxed panels for
anything that isn't a discrete content card; `.surface` / `.surface-card`
is the boxed panel treatment when one is needed.

## Motion

One quiet orchestrated entrance (`animate-fade-up`, `animate-route-enter`),
plus `animate-like-pop` and `animate-poster-crossfade`, all in `index.css`;
theme switches and nav links use view transitions (the theme one is
skipped under reduced motion). No motion library. Under `prefers-reduced-motion` the
entrances drop to a 150ms fade and the like pop is off. Focus rings appear
instantly, never transitioned in.

## Microinteractions stance

- Silent success (no toast for actions the user can already see happened).
- Optimistic like/unlike, no confirmation dialogs for reversible actions.
- Hover delay implicit (CSS `:hover`, not JS tooltips) — no timing to set here.
- Focus-visible ring on every interactive element, instant, ≥3:1 contrast.

## CTA voice

- Primary action: filled `Button` (`variant="primary"`, the default): flat,
  3px corners, no glow, a 1px press.
- Rail-edge secondary action: typographic link, `"See more →"`, no border,
  no fill (`variant="link"` when it's a button) — the Ecosystem Index pattern.
- Destructive: `Button variant="danger"` (outlined, fills on hover).

## Component voice

The old Home Feed's "templated" tell was three sidebar-style panels (two
trending rails and the composer) sharing one identical boxed treatment, not
color or type. The rails and composer are now de-boxed; a bordered box is
kept for discrete content (one card per watch), and structure comes from
hairlines and `.slate` strips.

## What pages MUST share

- The wordmark, mark, and nav/footer chrome.
- The Space Grotesk / Sora / JetBrains Mono pairing (plus Instrument Serif
  for quotes).
- The per-theme semantic color tokens — no page invents its own color.
- Hairline-first component voice: a bordered box is reserved for a discrete
  piece of content (a social-activity card, a movie preview), never for a
  structural container (sidebar, composer shell, rail).
- The CTA voice above.

## What pages MAY differ on

- Macrostructure within their family (browse pages can vary rail count/type;
  film and TV detail pages share the letterbox shape).
- Section/rail archetype chosen from the component cookbook.
- Enrichment — browse pages are typography+imagery only (posters/thumbnails
  already carry the visual weight); no additional enrichment tier needed.

## Home Feed (first page — Ecosystem Index family)

- **Nav:** a flat bar (brand · Feed / Films / TV · search on `/` or ⌘K ·
  notifications · profile), `h-11` on phones and `h-14` from `md`. Icon
  buttons (notification bell, profile-menu trigger) carry no permanent
  border: hover reveals a soft `bg-foreground/[0.06]` tint, with an explicit
  `focus-visible:ring-2 ring-ring/60` for keyboard users. One sliding
  underline marks the current link in its film or TV colour. On phones a
  bottom tab bar (`MobileTabBar`, Log in the centre) replaces the ☰ menu.
  The `HomePage` aside sticks at `top-16`, which clears the 56px bar.
- **Footer:** one `.slate` strip on the navbar's grid (`AppFooter`): Interis
  left, the motto centred, Developer and Docs right. The TMDB credit lives on
  the Developer page.
- **Rail (`FeedRail`):** de-boxed. "Now showing" (ranked films with
  `OutlinedRank`, then "On TV") and "Your week" each open with a `.kicker`
  title; rows are divided by `--line` hairlines, not a shared bordered panel.
- **Composer (`QuickLogComposer`):** no boxed panel; it sits at the top of
  the feed column above the filter sentence (`FeedFilterSentence`).
- **Feed (`FeedDayList`):** each day opens with a `.slate` date strip. A
  person's same-day actions on one title merge into one bordered card
  (`FeedTitleCard`, a discrete piece of content); other activity renders as
  `FeedActivityCard`. No box appears or disappears on hover.
