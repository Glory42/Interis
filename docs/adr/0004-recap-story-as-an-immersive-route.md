# The recap story is an immersive route, not a profile tab

The Year in Review page (`/profile/:username/year/:year`) is a stats dossier inside the profile layout: header, tabs, charts and facts. The Wrapped-style presentation needs a full-screen 9:16 stage, auto-advance, tap zones and per-card deep links. Keeping it inside the profile layout would leave the navbar, footer and phone tab bar around the stage, and would keep the profile loader on the critical path.

## Decision

The story is a top-level route at `/recap/:username/:year`. `apps/web/src/routes/__root.tsx` detects the `/recap/` prefix and renders the outlet without the app chrome. The story uses the same `GET /api/users/:username/year/:year` endpoint as the stats page; the endpoint gained the story fields and the viewing persona additively.

The existing `/profile/:username/year/:year` page stays as the **full breakdown**. The story's end card links to it. The home recap banner, the stats-page recap card and the year page's "Play the recap" button link to the story.

Share artifacts split by purpose:

- **1200×630** `/api/public/og/recap/:username/:year.jpg` stays the link-preview card and the `og:image` for both pages.
- **1080×1920** `/api/public/og/recap-story/:username/:year.jpg` is the story-format persona card used by the in-app share action.

## Consequences

- One dataset, two URLs: the story is shareable on its own and the dossier remains available.
- The root layout has a pathname exception for immersive routes; future full-screen routes can reuse it.
- Link previews for `/recap/...` run through the existing Pages Function meta mapping and add `/recap/*` to the routed paths.
- The story cannot render without the year-review endpoint; the loader caches it under the same `yearReviewKeys` key as the stats page.
- The share action depends on the public OG card service; a render failure falls back to copying the story link.
