# Deployment

## Overview

| Layer | Platform | How it deploys |
|-------|----------|-----------------|
| `apps/api/` | Render (Web Service, native Bun runtime) | Push to `master` → Render's GitHub integration auto-builds and deploys |
| `apps/web/` | Cloudflare Pages | Already set up (project `interis`) — push to `master` auto-builds and deploys; `functions/` adds link previews (below) |
| `apps/docs/` | Cloudflare Pages | Already set up (project `interis-docs`) — push to `master` auto-builds and deploys |
| DB migrations | Neon | Runs in Render's Build Command, before each deploy |

**Never run `bun run start` against production from your own machine.** Push to GitHub and let Render's Git integration pick it up.

## History

`apps/api` briefly ran on Hono + Cloudflare Workers, then moved to Hono on Render, then reverted to this Express version — all in the same evening. The short version: Workers' isolate sandboxing (no native crypto, a hard PBKDF2 iteration cap, a 128MB memory ceiling, a DB driver forced from pooled TCP to per-request HTTP) caused a string of production-only failures that never reproduced locally, and cost more debugging time than the edge-hosting benefit was worth for this app. Reverting to the last pre-Hono Express commit (same DB schema, same migrations, zero data compatibility issues — confirmed byte-identical migration files) was faster and safer than continuing to debug Workers-specific failure modes one at a time.

One real compatibility gap from that detour: a handful of accounts got their password/security-answer hash briefly upgraded to a `pbkdf2-sha256` format during the Workers/Render window (Bun's native argon2id isn't available under Workers, so that deployment used PBKDF2 instead). `PasswordService.verify()` in this Express version has a small fallback that still recognizes and verifies that format, then re-hashes to native `Bun.password` argon2id on success — so those accounts converge back automatically on next login, no manual data fix needed. Safe to delete that fallback once no `$pbkdf2-sha256$` hashes remain in `credentials`/`security_answers`.

---

## Render setup

Render Web Service, native runtime (not Docker — `apps/api/Dockerfile` has a `prod` target if you ever want Docker-based deploys instead; its entrypoint migrates with `scripts/docker-migrate.ts`, so it would need `DIRECT_DATABASE_URL` set):

| Field | Value |
|---|---|
| Root Directory | `apps/api` |
| Build Command | `bun install && bunx drizzle-kit migrate` |
| Start Command | `bun run start` |
| Health Check Path | `/api/health` |

Migrations run in the Build Command because Render's Pre-Deploy Command is
paid-only; on the free instance it silently never runs (0048–0059 piled up, 2026-11-01).

Don't use `bun run scripts/docker-migrate.ts` here — that script reads `DIRECT_DATABASE_URL` (not set on Render) and is meant for the local docker-compose Postgres and CI. Plain `drizzle-kit migrate` (using `DATABASE_URL` and the neon-serverless driver, which drizzle-kit picks whenever `@neondatabase/serverless` is installed) is correct for Render.

Render injects `PORT` automatically; `env.ts` already reads it from the environment with no code changes needed.

---

## Environment Variables

Set these in Render's Environment tab (Secrets, not the repo):

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Neon connection string |
| `JWT_ACCESS_SECRET` | 32+ chars |
| `TMDB_ACCESS_TOKEN` | Include the `Bearer ` prefix, same as `.env` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Only needed if avatar uploads are enabled |
| `CORS_ORIGIN` | The deployed web app's origin(s), comma-separated — required in prod; unset falls back to the local dev origins (`localhost`/`127.0.0.1:5173`) |
| `NODE_ENV` | `production` |

`TRUST_PROXY` defaults to `cloudflare`, which is right for this setup (Client → Cloudflare → Render's load balancer → app). Express then trusts only the private-network hop (Render's proxy) and Cloudflare's published ranges (`src/infrastructure/config/trust-proxy.ts`), walking `X-Forwarded-For` from the right. That makes `req.ip` the visitor, which keys the rate limiters and is stored as the session IP. A client can't choose its own IP by writing `X-Forwarded-For`, even when it calls the `*.onrender.com` origin directly. Set `none` to disable it, a hop count, or a comma-separated list of CIDRs. `true` is refused. If Cloudflare publishes new ranges (https://www.cloudflare.com/ips/), update the list.

Everything else (`AUTH_ACCESS_COOKIE_NAME`, `AUTH_REFRESH_COOKIE_NAME`, `JWT_ACCESS_TTL_SECONDS`, `REFRESH_TOKEN_TTL_SECONDS`, `USE_LOCAL_DB_PROXY`) has a safe default in `env.ts` and doesn't need to be set explicitly in production. Don't set `USE_LOCAL_DB_PROXY` at all unless you mean it — see the `z.stringbool()` note below.

### Local development

`apps/api/.env` (gitignored) is **not** a copy of this list — it points
`DATABASE_URL` / `DIRECT_DATABASE_URL` at a local Postgres and sets
`USE_LOCAL_DB_PROXY=true`. Dev and the test suite must never hit Neon (it
drains the Free plan's monthly network-transfer quota). Bring the DB up with
`docker compose up postgres db-proxy`, then `bun run dev`. See
[`apps/api/.env.example`](apps/api/.env.example).

---

## DNS

`api.interis.gorkemkaryol.dev` was previously bound to a Cloudflare Worker as a Custom Domain route; it's now pointed at Render (Cloudflare still proxies in front — check for `x-render-origin-server: Render` in response headers to confirm you're hitting Render, not a stale Worker). `apps/web` has no hardcoded backend URLs anywhere — it just talks to that hostname, so no frontend changes are needed regardless of what's behind it.

---

## Link previews (Cloudflare Pages Functions)

`apps/web` is a client-rendered SPA, so link-preview bots (Discord, Slack, X, iMessage,
WhatsApp, Telegram, Mastodon, Bluesky…) never see the per-page `<head>` that TanStack Router
sets. `apps/web/functions/` fixes that for the shareable pages: reviews, profiles (and their
tabs), lists, films, series, seasons, actors and directors.

- Pages builds `functions/` itself (esbuild, TypeScript) and only routes `/reviews/*`,
  `/profile/*`, `/movies/*`, `/serials/*`, `/actor/*` and `/director/*` through it. This needs
  the Pages project's **Root directory** to be `apps/web` (build `bun run build`, output `dist`).
- For a normal browser the function returns the static page untouched (`context.next()`), with
  no API call. For a link-preview bot it fetches `/api/public/meta/*` from the API and rewrites
  the `<title>`, description, `og:*` and `twitter:*` tags with `HTMLRewriter`. Any API error
  falls back to the plain page. Shared logic lives in `apps/web/link-preview/`.
- The API origin is read from the Pages variable `VITE_API_BASE_URL` (already set for the SPA
  build), else `LINK_PREVIEW_API_ORIGIN`, else `https://api.interis.gorkemkaryol.dev`.
- `og:image` points at a generated 1200×630 card, `/api/public/og/<kind>/<id>.png`, rendered on
  the API with satori + resvg. Cloudflare caches `.png` by default; meta responses are cached
  at the edge by the function (`cf.cacheEverything`).

Check it after a deploy:

```bash
curl -s -A "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)" \
  https://interis.gorkemkaryol.dev/movies/27205 | grep -E "og:|twitter:|<title>"
curl -s https://interis.gorkemkaryol.dev/movies/27205 | grep "og:title"   # browsers: unchanged generic tags
curl -sI https://api.interis.gorkemkaryol.dev/api/public/og/movie/27205.png  # 200 image/png
```

`wrangler pages dev` isn't needed for normal work: `vite` dev ignores `functions/`.

---

## Lessons worth keeping in mind (found the hard way)

### `z.coerce.boolean()` and any other stringly-typed env var

`z.coerce.boolean()` (zod v4) uses JavaScript's `Boolean(value)` semantics, not string parsing — `Boolean("false")` is `true`, because any non-empty string is truthy. Every env var arrives as a literal string regardless of source, so declaring `SOME_FLAG=false` anywhere would silently evaluate to `true`. This broke `USE_LOCAL_DB_PROXY` in production once already; `env.ts` now uses `z.stringbool()` for it. Use `z.stringbool()` for any boolean env var in `env.ts`, never `z.coerce.boolean()`.

### Don't trust local dev to reproduce every production failure mode

Several of the Workers-era bugs (a PBKDF2 iteration cap, a WASM codegen restriction, a 128MB memory cap) only ever showed up against real Cloudflare infrastructure — `wrangler dev`'s local simulator silently didn't enforce any of them. Render's a normal long-running Bun process, so this specific class of surprise shouldn't recur, but it's a good general reminder: a clean local run isn't proof a deploy target's real constraints are satisfied. Test against the actual target when a fix is meant to resolve a production-only symptom.

---

## Local Development

```bash
docker compose up postgres db-proxy   # from the repo root
cd apps/api
bun install
bun run scripts/docker-migrate.ts      # apply migrations to local Postgres
bun run dev         # Express on Bun, http://localhost:5000
```
