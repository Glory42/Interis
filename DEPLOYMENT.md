# Deployment

## Overview

| Layer | Platform | How it deploys |
|-------|----------|-----------------|
| `apps/api/` | Render (Web Service, native Bun runtime) | Push to `master` → Render's GitHub integration auto-builds and deploys |
| `apps/web/` | Cloudflare Pages | Already set up (project `interis`) — push to `master` auto-builds and deploys |
| `apps/docs/` | Cloudflare Pages | Already set up (project `interis-docs`) — push to `master` auto-builds and deploys |
| DB migrations | Neon | Runs as Render's Pre-Deploy Command, before each deploy |

**Never run `bun run start` against production from your own machine.** Push to GitHub and let Render's Git integration pick it up.

## History

`apps/api` briefly ran on Hono + Cloudflare Workers, then moved to Hono on Render, then reverted to this Express version — all in the same evening. The short version: Workers' isolate sandboxing (no native crypto, a hard PBKDF2 iteration cap, a 128MB memory ceiling, a DB driver forced from pooled TCP to per-request HTTP) caused a string of production-only failures that never reproduced locally, and cost more debugging time than the edge-hosting benefit was worth for this app. Reverting to the last pre-Hono Express commit (same DB schema, same migrations, zero data compatibility issues — confirmed byte-identical migration files) was faster and safer than continuing to debug Workers-specific failure modes one at a time.

One real compatibility gap from that detour: a handful of accounts got their password/security-answer hash briefly upgraded to a `pbkdf2-sha256` format during the Workers/Render window (Bun's native argon2id isn't available under Workers, so that deployment used PBKDF2 instead). `PasswordService.verify()` in this Express version has a small fallback that still recognizes and verifies that format, then re-hashes to native `Bun.password` argon2id on success — so those accounts converge back automatically on next login, no manual data fix needed. Safe to delete that fallback once no `$pbkdf2-sha256$` hashes remain in `credentials`/`security_answers`.

---

## Render setup

Render Web Service, native runtime (not Docker — `apps/api/Dockerfile` still exists and works if you ever want Docker-based deploys instead):

| Field | Value |
|---|---|
| Root Directory | `apps/api` |
| Build Command | `bun install` |
| Start Command | `bun run start` |
| Health Check Path | `/api/health` |
| Pre-Deploy Command | `bunx drizzle-kit migrate` |

Don't use `bun run scripts/docker-migrate.ts` here — that script is hardcoded to `DIRECT_DATABASE_URL` specifically for docker-compose's local Postgres proxy, and doesn't apply to a direct Neon connection. Plain `drizzle-kit migrate` (using `DATABASE_URL` and the neon-serverless driver) is correct for Render.

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
| `CORS_ORIGIN` | The deployed web app's origin(s), comma-separated |
| `NODE_ENV` | `production` |

Everything else (`AUTH_ACCESS_COOKIE_NAME`, `AUTH_REFRESH_COOKIE_NAME`, `JWT_ACCESS_TTL_SECONDS`, `REFRESH_TOKEN_TTL_SECONDS`, `USE_LOCAL_DB_PROXY`) has a safe default in `env.ts` and doesn't need to be set explicitly in production. Don't set `USE_LOCAL_DB_PROXY` at all unless you mean it — see the `z.stringbool()` note below.

### Local development

`apps/api/.env` mirrors this list (gitignored). `bun run dev` for local work.

---

## DNS

`api.interis.gorkemkaryol.dev` was previously bound to a Cloudflare Worker as a Custom Domain route; it's now pointed at Render (Cloudflare still proxies in front — check for `x-render-origin-server: Render` in response headers to confirm you're hitting Render, not a stale Worker). `apps/web` has no hardcoded backend URLs anywhere — it just talks to that hostname, so no frontend changes are needed regardless of what's behind it.

---

## Lessons worth keeping in mind (found the hard way)

### `z.coerce.boolean()` and any other stringly-typed env var

`z.coerce.boolean()` (in `env.ts`, zod v4) uses JavaScript's `Boolean(value)` semantics, not string parsing — `Boolean("false")` is `true`, because any non-empty string is truthy. Every env var arrives as a literal string regardless of source, so declaring `SOME_FLAG=false` anywhere would silently evaluate to `true`. This broke `USE_LOCAL_DB_PROXY` in production once already. Use `z.stringbool()` for any boolean env var in `env.ts`, never `z.coerce.boolean()`.

### Don't trust local dev to reproduce every production failure mode

Several of the Workers-era bugs (a PBKDF2 iteration cap, a WASM codegen restriction, a 128MB memory cap) only ever showed up against real Cloudflare infrastructure — `wrangler dev`'s local simulator silently didn't enforce any of them. Render's a normal long-running Bun process, so this specific class of surprise shouldn't recur, but it's a good general reminder: a clean local run isn't proof a deploy target's real constraints are satisfied. Test against the actual target when a fix is meant to resolve a production-only symptom.

---

## Local Development

```bash
cd apps/api
bun install
bun run dev         # Bun.serve, http://localhost:5000
```
