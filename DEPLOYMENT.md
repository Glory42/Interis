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
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Optional, turn on Web Push notifications (see below). Leave all three unset to keep push off; Settings → Notifications then says push isn't available |

`TRUST_PROXY` defaults to `cloudflare`, which is right for this setup (Client → Cloudflare → Render's load balancer → app). Express then trusts only the private-network hop (Render's proxy) and Cloudflare's published ranges (`src/infrastructure/config/trust-proxy.ts`), walking `X-Forwarded-For` from the right. That makes `req.ip` the visitor, which keys the rate limiters and is stored as the session IP. A client can't choose its own IP by writing `X-Forwarded-For`, even when it calls the `*.onrender.com` origin directly. Set `none` to disable it, a hop count, or a comma-separated list of CIDRs. `true` is refused. If Cloudflare publishes new ranges (https://www.cloudflare.com/ips/), update the list.

Everything else (`AUTH_ACCESS_COOKIE_NAME`, `AUTH_REFRESH_COOKIE_NAME`, `JWT_ACCESS_TTL_SECONDS`, `REFRESH_TOKEN_TTL_SECONDS`, `USE_LOCAL_DB_PROXY`) has a safe default in `env.ts` and doesn't need to be set explicitly in production. Don't set `USE_LOCAL_DB_PROXY` at all unless you mean it — see the `z.stringbool()` note below.

### Web Push (VAPID keys)

Push notifications are signed with a VAPID key pair. Generate one once, from `apps/api/`:

```bash
bunx web-push generate-vapid-keys
```

Set the printed **Public Key** as `VAPID_PUBLIC_KEY` and the **Private Key** as
`VAPID_PRIVATE_KEY` in Render's Environment tab, and `VAPID_SUBJECT` to a contact
URL push services can reach you at, e.g. `mailto:you@example.com`. Save and let
Render redeploy. Nothing is needed on Cloudflare Pages: the web app fetches the
public key from `GET /api/push/public-key`.

Keep the pair stable. Rotating it orphans every existing subscription: browsers
resubscribe the next time their owner turns the toggle on, and the old rows are
deleted as push services answer 404/410.

### Local development

`apps/api/.env` (gitignored) is **not** a copy of this list — it points
`DATABASE_URL` / `DIRECT_DATABASE_URL` at a local Postgres and sets
`USE_LOCAL_DB_PROXY=true`. Dev and the test suite must never hit Neon (it
drains the Free plan's monthly network-transfer quota). Bring the DB up with
`docker compose up postgres db-proxy`, then `bun run dev`. See
[`apps/api/.env.example`](apps/api/.env.example).

---

## Cloudflare edge cache for the API (set up by hand)

Cloudflare doesn't cache JSON by default. Without the rule below, every API request reaches Render and usually Neon. The origin already sends correct headers (`apps/api/src/commons/http/cache-control.helper.ts`):

- `public, max-age=…, s-maxage=…` on reads that are the same for everyone: trending/recent lists, search, the cached title row, people pages.
- `public, max-age=0, s-maxage=…` plus `Vary: Cookie` on signed-out Film/Series detail, reviews, archive, season and log reads. The edge may keep these, browsers never do.
- `private, no-store` on the same reads whenever an auth cookie is present, and on everything viewer-specific.

So the rule only needs to make these paths eligible and defer to the origin. In the dashboard, open the zone, then **Caching → Cache Rules → Create rule**:

- **Rule name:** `API public reads`
- **When incoming requests match** (custom filter expression; Free plan, so `starts_with`, not regex `matches`):

  ```
  (http.host eq "api.interis.gorkemkaryol.dev"
   and http.request.method eq "GET"
   and (starts_with(http.request.uri.path, "/api/movies/")
        or starts_with(http.request.uri.path, "/api/serials/")
        or starts_with(http.request.uri.path, "/api/people/")
        or http.request.uri.path eq "/api/search")
   and not http.cookie contains "interis_access_token"
   and not http.cookie contains "interis_refresh_token")
  ```

  The cookie names are `AUTH_ACCESS_COOKIE_NAME` / `AUTH_REFRESH_COOKIE_NAME` from `env.ts`. Change them here if those env vars are ever set.
- **Cache eligibility:** Eligible for cache
- **Edge TTL:** *Use cache-control header if present, bypass cache if not*. Responses with `private`/`no-store` or no header (errors, 401s) are then never stored.
- **Browser TTL:** Respect origin
- **Cache key:** leave the defaults. They include the full query string (archive filters, search terms) and the `Origin` header, so a cached CORS header is never replayed to another origin.

To check it: request a signed-out detail URL twice with `curl -sI -H "Origin: https://<web origin>" https://api.interis.gorkemkaryol.dev/api/movies/603/detail`. The second response should show `cf-cache-status: HIT`. A request with `-H "Cookie: interis_access_token=x"` should show `BYPASS` or `DYNAMIC`.

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
- That route list is pinned in `apps/web/public/_routes.json`, and
  `tests/unit/link-preview/routes-json.test.ts` keeps it in sync with `functions/`. Every
  Function run, **including a human's page load that only calls `context.next()`**, counts
  toward the account's shared Workers Free limit of 100k requests a day. Static assets are free.
  A root `_middleware.ts` would route every asset through the Function too, so the test rejects
  any file at the root of `functions/`. If you add a Function directory, add its `/<dir>/*` here too.
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

### Keeping cloud crawlers off the Function (set up by hand)

On 2026-11-17 headless browsers on cloud servers (mostly Microsoft Azure, AS8075) loaded these
pages in bursts and ran the Function 26k times in one day. Before the Function existed, the
same traffic cost nothing. Each load also boots the SPA and calls the API (`/api/users/me` 504s
on Render). WAF rules run before Pages Functions, so a challenged request isn't billed.

In the dashboard, open the zone, then **Security → WAF → Custom rules → Create rule** (Free plan
has 5; `starts_with`/`contains` only, no regex):

- **Rule name:** `Challenge cloud crawlers on link-preview pages`
- **Expression:**

  ```
  (http.host eq "interis.gorkemkaryol.dev"
   and (starts_with(http.request.uri.path, "/movies/")
        or starts_with(http.request.uri.path, "/serials/")
        or starts_with(http.request.uri.path, "/profile/")
        or starts_with(http.request.uri.path, "/reviews/")
        or starts_with(http.request.uri.path, "/actor/")
        or starts_with(http.request.uri.path, "/director/"))
   and ip.src.asnum in {8075 16509 14618 15169 396982 14061 24940 16276 63949 20473 31898 36351 45102 132203}
   and not cf.client.bot
   and not (lower(http.user_agent) contains "discordbot"
            or lower(http.user_agent) contains "twitterbot"
            or lower(http.user_agent) contains "facebookexternalhit"
            or lower(http.user_agent) contains "slackbot"
            or lower(http.user_agent) contains "telegrambot"
            or lower(http.user_agent) contains "whatsapp"
            or lower(http.user_agent) contains "linkedinbot"
            or lower(http.user_agent) contains "skypeuripreview"
            or lower(http.user_agent) contains "microsoftpreview"
            or lower(http.user_agent) contains "mastodon"
            or lower(http.user_agent) contains "bluesky"
            or lower(http.user_agent) contains "cardyb"
            or lower(http.user_agent) contains "redditbot"
            or lower(http.user_agent) contains "embedly"
            or lower(http.user_agent) contains "iframely"))
  ```

  The ASNs are the large clouds and hosts: Microsoft, AWS, Google Cloud, DigitalOcean, Hetzner,
  OVH, Linode, Vultr, Oracle, IBM, Alibaba and Tencent. Verified bots (Googlebot, Bingbot) and
  link-preview fetchers, several of which run on those clouds (Teams on Azure, Discord on
  Google Cloud), are let through. A person on a cloud VPN gets a one-time Managed Challenge.
- **Action:** Managed Challenge. Keep it scoped to the web host: API calls are `fetch()`es that
  can't solve a challenge, so never apply it to `api.interis.gorkemkaryol.dev`.

Don't turn on **Bot Fight Mode** instead. On Free it applies to the whole zone, including the
API and the f1 Worker, and rules can't skip it.

To check it: **Security → Events** should show the rule's challenges during a burst, and the
hourly `pagesFunctionsInvocationsAdaptiveGroups` count for this project (scriptName
`pages-worker--12007314-production`) should stay in the hundreds instead of 2–6k an hour.
A normal browser on a home connection still gets the page with no challenge.

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
