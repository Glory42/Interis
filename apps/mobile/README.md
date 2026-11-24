# Interis Mobile

React Native (Expo SDK 58 + Expo Router) client for Interis. It talks to the
same backend as the web app (`apps/api`) and reuses its auth cookies, theme
ids and response shapes.

## Run

```bash
cd apps/mobile
bun install
bun run start        # then press i (iOS simulator) / a (Android) or scan the QR code with Expo Go
```

The app talks to the deployed API (`https://api.interis.gorkemkaryol.dev`)
by default, so no local backend is needed. To use another server (e.g. a
local `apps/api` on :5000), set `EXPO_PUBLIC_API_BASE_URL` in `.env.local`
(see `.env.example`).

## Checks

```bash
bun run typecheck
bun run lint
bun run doctor
```

## Structure

```
assets/                 app icon, splash, adaptive icon (from the web logo)
src/
├── app/                Expo Router routes only (thin re-exports of screens)
│   ├── (tabs)/         Feed · Movies · Series · Search · You
│   ├── movie/[tmdbId]  serial/[tmdbId] (+ season/[seasonNumber])
│   ├── user/[username] (+ follows)   review/[username]/[reviewId]
│   └── login · register · notifications · settings
├── screens/            one component per screen
├── components/
│   ├── ui/             primitives: AppText, Surface, Button, Sheet, tabs, chips…
│   ├── media/          Poster, PosterTile/Grid/Rail, RocketRating, MediaHero, LogMediaSheet…
│   ├── feed/           feed activity cards (timeline / review / post)
│   ├── reviews/        review card, spoiler gate, like/comment buttons
│   └── profile/        header, top picks, diary row, currently watching…
├── hooks/              React Query hooks + `<feature>Keys` factories
├── api/                apiRequest client and per-domain request functions
├── types/              Zod schemas mirroring apps/web
├── theme/              the four web themes as RN tokens + ThemeProvider
└── lib/                config, query client, time/media/color helpers, toast
```

The same performance rules as the web apply (see the root `CLAUDE.md`): no
polling, narrow query invalidation, paginated user-generated lists, memoized
list items.
