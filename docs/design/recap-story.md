# Recap Story — "A Year in the Dark"

**Status:** design draft for [#251](https://github.com/Glory42/Interis/issues/251). Implements the parent epic [#250](https://github.com/Glory42/Interis/issues/250).

**Prototype:** [`docs/design-review/recap-story.html`](../design-review/recap-story.html) — clickable, 13 cards, mock data.

**What this is:** the presentation layer for a user's year in film and TV. It sits beside the existing Year in Review stats page; it does not replace it. The story is the trailer, the current page is the dossier.

**Working names:** the feature is **Recap Story** in code; the UI says **Your 2025 Recap**. The campaign line is **"A Year in the Dark."**

---

## 1. The idea

A private screening of your year.

The current year page is organized by category — rhythm, taste, ratings, people, goal. It is accurate, but it reads like a report. The story reorders the same data into a portrait:

1. **Scale** — how much of your year went to films and TV.
2. **Obsession** — the titles, people and genres you kept returning to.
3. **Identity** — what your habits say about the kind of viewer you were.
4. **Surprise** — the pattern you probably did not notice.
5. **Connection** — what you wrote, who read it, who followed.
6. **Verdict** — the persona, the shareable "this was me" card.

The visual language is cinema, not Spotify gradients: a black screening room, a countdown leader, film perforations, projector light, grain, ticket stubs, and end credits. The type is the app's own: Space Grotesk for statements, JetBrains Mono for receipts, Instrument Serif for the lines that should feel written rather than generated.

### Principles

- **One idea per card.** If a card needs a table, it belongs on the full stats page.
- **A number is not a story until it is framed.** "214 hours" is data; "8.9 days in other worlds" is the story.
- **Second person, short, dry, specific.** No exclamation marks. No "iconic." No fake enthusiasm.
- **The share moment is designed first.** Every card should survive a 9:16 screenshot with no UI chrome.
- **The persona is a portrait of a year, not a permanent label.** Say "This year, you were..." and show the receipts.
- **Do not infer sensitive traits.** Personas are behavioural. Genres are shown as taste, not identity.
- **The existing page stays.** The story ends with a "Full breakdown" link back to it.

---

## 2. The deck

Full-year deck: 13 cards. Conditional cards drop out when their data is missing. The exact copy below uses the sample year in the prototype.

| # | Card | Hero line | Supporting copy | Built from | Fallback |
|---|---|---|---|---|---|
| 01 | **Cold open** | `A YEAR IN THE DARK` | `A private screening for Maya · 2025` + poster wall + `Begin` | user, year, `posterPaths` | If no posters, a dark countdown leader only. |
| 02 | **The volume** | `214 hours.` | `That's 8.9 days in other worlds.` · `47 films · 12 series · 1,204 episodes` | `totals`, `previousYear` | Always present if depth is not empty. |
| 03 | **The five** | `The five that stayed.` | #1 hero + 2×2 grid, with title, year, rating | `topFilms` | Fewer than 3 films → show what exists as a list; 0 films → skip. |
| 04 | **The one** | `Your film of the year.` | Poster, backdrop, `9.5 / 10`, optional review line | `topFilm`, optional review | No rating → no score; no review → no quote. |
| 05 | **The series** | `And the one you binged.` | Top 3 series + `1,204 episodes across 12 series` | `topSeries`, `episodes` | 0 series → skip. |
| 06 | **The type** | `You had a type.` | `DRAMA` · `38% of everything you watched` · top 3 genres | `topGenres`, `films + series` | No genres → skip. |
| 07 | **The director** | `You followed Bong Joon-ho.` | `4 films.` + poster strip | `topDirectors`, `directorTitles` | Fewer than 2 films by the director → skip. |
| 08 | **The time machine** | `You watched like it's 1974.` | `Your viewing age: 1974` · decade timeline · `43% before 1980` | `viewingAge` / median release year, `decades` | No release years → skip. Contemporary median → "You keep up." |
| 09 | **The rhythm** | `June was your season.` | 12-month bars · `23-day streak` · `Jul 14: 4 films` | `months`, `longestStreak`, `busiestDay` | No logs → skip (only on empty year). |
| 10 | **The taste** | `You're a soft touch.` | `8.4 average vs 6.9 from the room` · `12 titles at 9+` · most rewatched | `ratings`, `highRatings`, `mostRewatched` | No ratings and no rewatch → skip. |
| 11 | **The words** | `You wrote 14 reviews.` | Most-liked quote · `42 likes` · `3 lists · 23 new followers` | `reviews`, `listsCreated`, `newFollowers` | Nothing to show → skip. |
| 12 | **The verdict** | `This year, you were...` | `THE TIME TRAVELLER` · tagline · description · trait chips · poster wall | `persona` | Thin year → skip persona, use "A short film." |
| 13 | **End credits** | `That's a wrap.` | Goal line · summary · `Share` · `Full breakdown` · `Log a film` | `goal`, `totals` | Always present. |

### Card-by-card notes

**01 · Cold open.** A 3×4 poster wall, dimmed under a vertical scrim. The title is the largest thing on screen. The poster wall is the user's year, not a generic collage. A faint countdown-leader circle in the top right carries the "screening" idea without delaying the content. `Begin` is the only action; the progress bar starts after it.

**02 · The volume.** The number counts up. The label is "hours", the sub-line converts it to days. The three totals sit in a row with film/series accent dots. The previous-year comparison is a small pill, not a chart. The background has a low projector beam and a faint film-strip edge.

**03 · The five.** One hero poster for #1, then a 2×2 grid. The title and rating sit next to each poster. If the user has no ratings, the cards still work — rank by log count and recency, and omit the score. The list is not a carousel; it is one composed image.

**04 · The one.** The emotional peak. Use the backdrop when available, with the poster in front. The rating is large. If the user wrote a review of that title, show one line of it in Instrument Serif; otherwise show the release year and director. Link to the title page.

**05 · The series.** Three rows, each with a poster, title, rating and episode count. The footer line totals the series and episodes. Use the series accent (cyan) for the labels.

**06 · The type.** The top genre is the visual: a huge word, set in the display face, with the share of the year underneath. The other two genres are small rows with percentages. Do not show a pie chart.

**07 · The director.** The director's name is the hero. The count is the receipt. The poster strip shows up to 3 of their films from that year. If the director has a person page, link the name. If there is no repeat director, skip the card rather than celebrating a single film.

**08 · The time machine.** The surprise. The median release year is the "viewing age"; the decade bars show the spread. The 1970s bar is highlighted in amber. If the median is contemporary, the line changes to "You keep up" and the spread still carries the card. Include the oldest title when available.

**09 · The rhythm.** The shape of the year. Twelve bars, with the busiest month highlighted. Below: the longest streak and the busiest day. Keep the first/last watch for the full stats page or the end credits; do not crowd this card.

**10 · The taste.** Two numbers side by side: the user's average and the community average. The line is "You're a soft touch" if they are above the room, "You have notes" if below. Show the count of 9+ ratings and the most rewatched title. Use the rocket scale only if it reads at a glance; otherwise a simple bar.

**11 · The words.** A quote card. The most-liked review is the emotional proof that this is a person, not a list. Show the like count and the title. Below: reviews, lists, new followers. If the review contains spoilers, show "Contains spoilers — read it on Interis" and link out; never leak the excerpt.

**12 · The verdict.** The shareable artifact. Persona name, tagline, one-paragraph description, four trait chips, poster wall, and the receipts line. It should look complete even if it is the only card someone sees. Put `@username` and the Interis mark in the footer.

**13 · End credits.** A short credit roll: the totals, the goal outcome, and "See you in 2026." Actions: share the recap, open the full breakdown, log a film. For a guest, replace "Log a film" with "Start your own journal" and show a follow button.

---

## 3. Variants

### Full year (`depth === "full"`, 10+ logs)

All 13 cards, with conditional cards dropped when the data is missing. A typical full year has 10–13 cards.

### Thin year (`depth === "thin"`, 1–9 logs)

Five cards:

1. **Cold open** — "A SHORT FILM." / "Maya's 2025, in a few frames."
2. **The volume** — totals without the previous-year comparison if there is none.
3. **The titles** — up to 4 titles, no ranking; "The year in titles."
4. **One highlight** — the strongest of genre / director / time machine / rhythm.
5. **End credits** — "That's a wrap." + CTA.

No persona below 5 logs: there is not enough behaviour to make the label honest. At 5–9 logs, the persona may appear if the dominant signal is strong (e.g. 4 rewatches out of 6 logs); otherwise use "A short film."

### Empty year (`depth === "empty"`)

One card:

> **A QUIET YEAR.**
> Nothing logged in 2025. The screen is still dark.
> `Log a film` · `See your stats`

No share, no persona, no bars.

### Partial year (current UTC year)

The cover says "2025 so far." The volume card says "so far" in the sub-line. The end credits say "The year isn't over. Keep logging." The recap season (Dec 1 – Jan 15) still points at the previous year, as it does today.

---

## 4. The persona

The persona is the "Listening Personality" equivalent. It is **behavioural**, not genre-based, and it is deterministic: the same year data always produces the same result.

### Inputs

From the year review:

- `logs`, `films`, `series`, `filmLogs`, `seriesLogs`, `episodes`
- `hoursWatched`, `rewatchLogs`, `mostRewatched.logCount`
- `avgRating`, `communityAverage`, `ratedLogs`, `highRatings`
- `topGenres`, `topDirectors`, `decades`, `distinctGenres`, `distinctDirectors`
- `reviews.count`, `listsCreated`, `newFollowers`
- `longestStreak.days`, `busiestMonth.count`, `busiestDay.count`
- `viewingAge` (median release year), `pre1980Share` (from decades)

Derived ratios:

```
seriesShare   = seriesLogs / max(logs, 1)
rewatchShare  = rewatchLogs / max(logs, 1)
reviewsPerLog = reviews.count / max(logs, 1)
topGenreShare = topGenres[0].count / max(films + series, 1)
ratingDelta   = avgRating - communityAverage   (when both exist)
```

### Scoring

Each persona gets a score from 0 to 1. The highest score wins. If the highest score is below **0.45**, the result is **The Devotee**. Ties within 0.05 go to the earlier persona in the table order.

| Persona | Score sketch |
|---|---|
| **The Time Traveller** | `0.70 × min(pre1980Share / 0.40, 1) + 0.30 × clamp((1990 − viewingAge) / 40, 0, 1)` |
| **The Completionist** | `0.50 × seriesShare + 0.30 × min(episodes / 600, 1) + 0.20 × min(series / 20, 1)` |
| **The Rewatcher** | `0.70 × min(rewatchShare / 0.25, 1) + 0.30 × min(mostRewatched.logCount / 4, 1)` |
| **The Marathoner** | `0.40 × min(logs / 150, 1) + 0.30 × min(hoursWatched / 400, 1) + 0.20 × min(longestStreak / 21, 1) + 0.10 × min(busiestDay.count / 4, 1)` |
| **The Curator** | `0.50 × min(reviews.count / 15, 1) + 0.30 × min(listsCreated / 4, 1) + 0.20 × min(reviewsPerLog / 0.30, 1)` |
| **The Critic** | `0.60 × clamp(−ratingDelta / 1.5, 0, 1) + 0.30 × min(reviews.count / 10, 1) + 0.10 × min(ratedLogs / 30, 1)` — zero unless `ratingDelta < −0.30` |
| **The Romantic** | `0.50 × clamp(ratingDelta / 1.0, 0, 1) + 0.40 × clamp((avgRating − 7.5) / 2, 0, 1) + 0.10 × min(highRatings / max(ratedLogs, 1) / 0.50, 1)` — zero unless `avgRating ≥ 7.5` |
| **The Explorer** | `0.50 × min(distinctGenres / 10, 1) + 0.30 × min(distinctDirectors / 25, 1) + 0.20 × (1 − topGenreShare)` |
| **The Devotee** | Default; score 0.45. Wins only when nothing else clears the bar. |

The weights and thresholds are a starting point, not a law. Tune them against real years after the API slice ships; keep the tests as the contract.

### Copy

| Persona | Tagline | Description |
|---|---|---|
| **The Time Traveller** | "You spent the year in the past. It looked better there." | "Your median watch was released in {year}. You moved through the year like a regular at a repertory cinema — {share}% of what you watched was made before 1980." |
| **The Completionist** | "One more episode. You said that {episodes} times." | "{series} series, {episodes} episodes. You do not leave a story half-told." |
| **The Rewatcher** | "You know what you like. You went back to check." | "{rewatchShare}% of your logs were rewatches. Comfort is a valid genre." |
| **The Marathoner** | "Sleep is a post-credits scene." | "{logs} logs, {hours} hours, a {streak}-day streak. The credits rolled and you pressed play again." |
| **The Curator** | "You don't just watch. You arrange." | "{reviews} reviews, {lists} lists. You turn a year of watching into something other people can read." |
| **The Critic** | "You have notes. You wrote them down." | "You rated {delta} below the room. You have notes, and you wrote them down." |
| **The Romantic** | "You lead with your heart." | "You averaged {avg} while the community averaged {community}. You lead with your heart." |
| **The Explorer** | "No two nights the same." | "{genres} genres, {directors} directors. You kept changing the channel." |
| **The Devotee** | "A steady year at the movies." | "{logs} logs, {hours} hours, and a seat that knew your name." |

### Trait chips

Up to four, in this order:

1. Top decade (`1970s`)
2. Top genre (`Drama`)
3. Secondary persona, if its score is above 0.35 (`Rewatcher`)
4. Average rating (`8.4 avg`), if there are ratings

The chips are receipts, not adjectives. Do not invent traits the data does not support.

### Edge cases

- **Thin year:** no persona below 5 logs. At 5–9 logs, require the top score ≥ 0.60; otherwise "A short film."
- **No ratings:** skip The Critic and The Romantic; The Devotee is more likely.
- **No rewatch:** The Rewatcher scores zero; do not mention rewatches.
- **No community average:** ratingDelta is unavailable; The Critic and The Romantic can still score from the absolute average, but the description must not compare to the room.
- **Series-only:** The Completionist can win; the film-specific cards drop out. The time machine can still use series release years.
- **Films-only:** The Completionist scores zero; the series card drops out.
- **Very long year:** The Marathoner and The Devotee should not both feel generic. Use the streak and busiest day to keep the description specific.
- **Sensitive edges:** do not name a genre as an identity. "The Time Traveller" is about release years, not the person. Do not infer age, gender, sexuality, religion, or nationality.

---

## 5. Visual system

### Palette

The story is theme-aware. The screening room borrows the active theme's stage, text, line and accent roles; it does not ship a second fixed palette.

| Role | Source | Use |
|---|---|---|
| `stage` | `--bg` | The card background |
| `surface` | `--surface` | Poster fallbacks, panels |
| `fg` | `--fg` | Primary text |
| `muted` | `--muted-foreground` | Labels, secondary text |
| `faint` | `--faint` | Receipts, disabled |
| `line` | `--line` | Hairlines |
| `line-strong` | `--line-strong` | Emphasised rules, chips |
| `film` | `--film` | Films, time machine, projector light |
| `series` | `--series` | Series, episode counts |
| `like` | `--like` | Review likes, hearts |
| `primary` | `--primary` | CTAs, share |
| `primary-fg` | `--primary-foreground` | Text on the CTA |
| `grain` | `--grain` | Film grain strength |

Scrims use `color-mix` against `--bg`, not a baked black. Rose Pine, NULL://LOG and Nitrate stay dark; Marquee is a bright "paper" cut with stronger washes so its dark ink stays readable. Share cards are separate artifacts and keep their fixed 1080×1920 / 1200×630 Cinema palette.

### The room

Every data card sits in a room made of the year's own material:

- **Backdrop:** the top title's `backdropPath` fills the card, dimmed and shifted per card so the same still does not read as wallpaper.
- **Poster wall:** up to 20 posters from `posterPaths` in a rotated 5×4 collage, blended at low opacity.
- **Projector beam:** a soft cone from the top edge, plus the theme grain on top.
- **Poster fan:** the volume and genre cards also show five of the year's posters in a loose strip, so they are not only numbers.
- **Scrim:** a radial and vertical `--bg` wash keeps body text at 4.5:1 and display text at 3:1.

The cover gives the story a free beat before `Begin`; the route preloads the spotlight backdrop and the wall posters there so the data cards do not pop in mid-show. The cover and persona keep their denser 4×4 poster walls. The spotlight is the exception: its backdrop is sharp and full-bleed, with the poster presented in front.

### Type

| Role | Font | Notes |
|---|---|---|
| Display | Space Grotesk 700 | Statements, persona name, huge numbers. Tracking `-0.04em`, line-height 0.92–1.05. |
| Body | Sora 400/500 | Descriptions. 14–16px on mobile, 16–18px on desktop. |
| Mono | JetBrains Mono 500/700 | Kickers, receipts, stats, progress. Uppercase labels at 10–11px, tracking `0.12em`. |
| Serif | Instrument Serif italic | Taglines, review quotes, the "oldest watch" line. 22–30px. |

Scale (mobile 9:16): hero 64–112px, statement 32–44px, persona name 44–64px, body 14–16px, label 10–11px. Desktop stage is 430–460px wide; use `clamp()` and keep the same proportions.

### Layout

- 9:16 stage, `max-width: 460px`, `max-height: 92vh`, centered on a black page. On phones, full viewport with `100dvh` and safe-area padding.
- 22–24px side padding, 24px top/bottom, plus the progress bar.
- The top bar holds the progress segments and pause/close. The bottom bar holds the hint and the slide count.
- Content is composed, not scattered: a kicker at the top, the visual in the middle, the statement and receipts at the bottom.
- The stage has a thin `1px` hairline and a soft shadow; no rounded cards, no glassmorphism.

### Motifs

- **Countdown leader:** a circle with a crosshair and a number, low opacity, on the cover and the end card.
- **Film perforations:** a subtle repeating pattern on the stage edges or as a divider. Use it sparingly; it should read as texture, not decoration.
- **Projector beam:** a cone of amber light from the top center on the volume and time-machine cards.
- **Grain:** the existing `--grain` idea, as an SVG noise overlay at 6–10% opacity.
- **Ticket stub:** notched corners for trait chips and the share card.
- **End credits:** mono rows with dotted leaders for the final summary.

### Responsive

- **Phone:** full-screen stage; progress bars at the top; tap zones full width; footer hints hidden below 380px; safe areas respected.
- **Tablet/desktop:** centered stage with a blurred poster backdrop, a side rail for card list/pause/share, and keyboard controls. The page around the stage is dark and quiet.
- **Landscape phone:** the stage stays 9:16 and letterboxes; do not stretch it.

---

## 6. Motion and interaction

### The player

- **Auto-advance:** 8 seconds per card. The progress segment fills linearly. The cover does not auto-advance; the user taps `Begin`.
- **Tap-through:** tap the right 70% to advance, the left 30% to go back. No separate skip button. This is the Spotify Wrapped behaviour.
- **Pause:** a hidden tab or the pause button. The progress bar stops; resuming continues from the same point. Do **not** pause on focus: the focus trap moves focus to a control when the story starts, which would stop the show immediately. Do not pause on hover either: the stage covers the viewport, so a resting pointer would stop auto-advance permanently.
- **Keyboard:** `ArrowRight` / `ArrowLeft` navigate, `Space` toggles pause, `Escape` exits to the profile stats tab.
- **Swipe:** horizontal swipe advances/goes back; vertical swipes pass through to the page (the stage is scroll-locked, so vertical is a no-op).
- **Progress:** 13 segments (one per card), each a button with an accessible label. Completed segments are filled; the active one fills. Clicking a segment jumps to that card.
- **Deep link:** `?slide=<id>`; the player opens on that card. Invalid ids fall back to the cover. The slide id is stable (`volume`, `top-films`, `time-machine`, `persona`, ...).
- **Prefers-reduced-motion:** no auto-advance, no count-ups, no Ken Burns, no parallax. Transitions become a 150ms fade. The player defaults to manual.
- **Visibility:** pause when the tab is hidden; resume when it is visible, unless the user paused manually.

### Motion grammar

- Card enter: opacity 0→1 and translateY 16px→0, 500ms, `cubic-bezier(0.23, 1, 0.32, 1)`.
- Stagger: 60–80ms between lines of content.
- Number count-up: 900ms, ease-out, from 0 to the value. Do not count up when reduced motion.
- Bars: scaleY 0→1, 700ms, 50ms stagger.
- Poster wall: slow scale 1.0→1.04 over 10s (Ken Burns), paused when reduced motion.
- Card transition: crossfade 300ms with a 1.02→1.0 scale. No horizontal slide; stories fade.
- Progress: linear fill over the 8s auto-advance; instant jump on tap.

### Micro-interactions

- `Begin` fades the cover down and starts the first card.
- Tapping a progress segment jumps; the active segment's fill restarts.
- The share button copies/downloads with a short "Saved" state; never blocks the player.
- The end card can replay or return to the full breakdown.

---

## 7. Share cards (1080×1920)

The existing recap card stays 1200×630 for link previews. The story adds vertical cards for sharing to stories/Reels.

### Persona card (primary)

- Top: `INTERIS · 2025` in mono, small.
- Kicker: `THIS YEAR, YOU WERE`.
- Name: the persona, 2 lines max, 120–150px.
- Tagline: Instrument Serif italic, 36–42px.
- Description: 2–3 lines, 28–32px.
- Trait chips: 4 ticket stubs.
- Poster wall: top 6 posters, faded, behind the text or at the bottom.
- Footer: `Based on 47 films · 12 series · 1,204 episodes` and `@maya`.
- The card should read at thumbnail size: the persona name and one line are enough.

### Data cards (v1)

- **The five:** 5 posters with rank numbers and ratings.
- **The time machine:** `1974` + decade bars + `43% before 1980`.

Per-slide share for every card is a phase 2 extension. V1 shares the persona and one data card; the end card shares the whole recap link.

### Share UX

- Mobile: `navigator.share({ files })` when supported, with the JPEG and a first-person text line.
- Desktop: download the JPEG and copy the deep link.
- Failure: fall back to copy link; show a toast.
- The link opens the current slide (`?slide=persona`), not the cover.

### Copy examples

- Persona: "I was The Time Traveller in 2025. 43% of what I watched was made before 1980. See your year in review on Interis."
- Volume: "214 hours in the dark in 2025. 47 films, 12 series, 1,204 episodes. See my year in review on Interis."

---

## 8. Accessibility

- Each card is a `<section role="group" aria-roledescription="slide" aria-label="3 of 13: The five">`.
- A visually hidden live region announces the slide: "Slide 3 of 13. The five. The five that stayed."
- Progress segments are `<button>` elements with `aria-label="Go to slide 4: The one"` and `aria-current`.
- Tap zones are buttons or have keyboard equivalents; minimum 44×44 targets.
- Focus is trapped in the player with `react-focus-lock`; on mount, focus the player container with `tabIndex={-1}`.
- `Escape` exits to the profile stats tab; the close button is always visible.
- Auto-advance pauses on a hidden tab or manual pause — never on focus or hover. Reduced motion defaults to manual.
- Text over posters/backdrops always has a scrim; target 4.5:1 for body text and 3:1 for large display text.
- Images: meaningful posters get `alt="{title} ({year})"`; decorative wall images get `alt=""`.
- No audio in v1. No autoplaying sound.
- The story must be fully usable with keyboard only and with a screen reader. Test at 320px, 390px, tablet, and desktop.

---

## 9. Technical handoff

### API additions (issue #252)

Additive to `YearReview`:

```ts
topFilms: RankedTitle[];        // up to 5, rating/logCount/watchedDate
topSeries: RankedTitle[];       // up to 5
topFilm: SpotlightTitle | null; // #1 + optional review excerpt
// Every Title carries backdropPath (nullable) for the spotlight and the room.
topSeriesSpotlight: SpotlightTitle | null;
busiestDay: { day: string; count: number; titles: Title[] } | null;
viewingAge: number | null;      // median release year
pre1980Share: number | null;    // 0–1
highRatings: number;            // count of ratings >= 9.0
directorTitles: Title[];        // up to 3, for the top director
distinctGenres: number;
distinctDirectors: number;
posterPaths: string[];          // up to 18 for the wall
persona: {
  id: PersonaId;
  name: string;
  tagline: string;
  description: string;
  traits: string[];
  score: number;                // for debugging/tests; not shown
} | null;
```

Everything else the story needs already exists in the endpoint.

### Frontend modules (issues #253–#257)

```
features/year-review/story/
  story.types.ts          # StorySlide discriminated union
  build-story.ts          # buildStory(review) -> StorySlide[]
  story-player.tsx        # index, auto-advance, tap/keyboard/swipe, progress
  story-slide.tsx         # shell: background, scrim, kicker, content
  slides/
    cover-slide.tsx
    volume-slide.tsx
    ranked-titles-slide.tsx
    spotlight-slide.tsx
    series-slide.tsx
    genre-slide.tsx
    director-slide.tsx
    time-machine-slide.tsx
    rhythm-slide.tsx
    taste-slide.tsx
    words-slide.tsx
    persona-slide.tsx
    end-credits-slide.tsx
  story-share.tsx
  story-model.test.ts
```

- `buildStory` is pure; it decides the deck and the order. No React, no fetch.
- The player owns navigation and timing; slides are presentational.
- The route is `/recap/$username/$year`; the root layout hides the app chrome for `/recap/*`.
- The existing `/profile/$username/year/$year` page stays and gets a "Play the recap" CTA.
- The story's end card links back to it as "Full breakdown".
- Share cards live in `apps/api/src/infrastructure/share-cards/` with a 1080×1920 frame; the existing 1200×630 recap card is unchanged.

### Tests

- `buildStory`: full, thin, empty, partial, films-only, series-only, no ratings, no director, no rewatch, no reviews.
- Persona: each archetype, ties, threshold, missing data, thin year.
- Player: auto-advance with fake timers, pause/resume, tap zones, keyboard, swipe, deep link, reduced motion.
- API: integration tests for the new fields and the three depth variants.
- Share: 1080×1920 render, cache key per slide, native share fallback.
- E2E: banner → story → all cards → end card → full breakdown; guest view; share link.

---

## 10. Decisions and open questions

### Decided

- Keep the existing year page as the full breakdown.
- Persona in; behavioural, positive/neutral, "This year you were..." with receipts.
- Auto-advance + tap-through; no separate skip button.
- Route `/recap/$username/$year`; immersive chrome.
- Theme-aware room: backdrop + poster wall + projector light, scrimmed against the active `--bg`.
- 13-card full deck; 5-card thin; 1-card empty.
- Share: persona + one data card in v1; link previews stay 1200×630.

### Open for review

1. **Persona names.** Approve the nine above, or swap any that feel too cute or too judgemental. "The Critic" and "The Devotee" are the ones most likely to be misread.
2. **Auto-advance timing.** 8 seconds is the draft. 7 seconds feels faster and more Wrapped; 9 seconds gives slow readers room. Recommend 8.
3. **Cover treatment.** Poster wall + title (recommended) vs a pure countdown leader. The prototype uses the wall with a small leader mark.
4. **Thin-year persona.** Recommend no persona below 5 logs; at 5–9 logs, require a strong signal. Is that too conservative?
5. **Per-slide share in v1.** Recommend persona + time machine only; every card is phase 2. Is the extra server-render cost worth it now?
6. **The "double feature" card.** A same-day pairing with the biggest genre/decade gap is a great surprise, but it needs a pairing query and careful copy. Phase 2?
7. **End-card CTA for guests.** Follow the profile vs "Start your own journal" as the primary. Recommend "Start your own journal" for logged-out viewers, follow for logged-in non-owners.

### Non-goals for this design

- No global percentile, leaderboard, or friends' recap hub.
- No generated video or audio.
- No new animation library.
- No changes to the existing year page's layout or the 1200×630 share card.

---

## 11. Implementation notes (2026-11-28)

The shipped feature follows the deck and the design system above. Decisions that were open in §10 are now closed:

- **Persona names:** kept as specified (The Time Traveller, Completionist, Rewatcher, Marathoner, Curator, Critic, Romantic, Explorer, Devotee).
- **Auto-advance:** 8 seconds per card. No hover or focus pause; the clock pauses when the tab is hidden or the user pauses. Reduced motion stays manual.
- **Cover:** the poster wall with the title, not a standalone countdown leader.
- **Thin-year persona:** no persona below 5 logs; at 5–9 logs the top score must clear 0.60.
- **Share scope:** the persona card is the v1 story artifact. Per-slide sharing is a later extension.
- **Double Feature:** deferred. The deck has the time machine and rhythm cards as its surprises.
- **Guest end card:** "Start your journal" for guests, "Back to profile" for signed-in visitors, and "Full breakdown" plus "Log a film" for the owner.

### What landed

- `/recap/:username/:year` is a top-level immersive route; the existing `/profile/:username/year/:year` remains the full breakdown. See [ADR 0004](../adr/0004-recap-story-as-an-immersive-route.md).
- The story has 13 card components, a five-card thin deck and a one-card quiet year. The development placeholder is gone.
- The entry points are the home recap banner, the stats-page recap card and the year page's "Play the recap" button. `/recap/*` has its own Pages Function link preview.
- The share action fetches the 1080×1920 card at `/api/public/og/recap-story/:username/:year.jpg`, uses the native file share when available, and falls back to a JPEG download plus the deep link. The 1200×630 recap card remains the link-preview image.
- Focus is kept inside the story, mobile controls are 44px, the progress segments have a 19px hit area, and the existing live region, labels, keyboard controls and reduced-motion handling remain.
