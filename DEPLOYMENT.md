# Deployment

## Overview

| Layer | Platform | How it deploys |
|-------|----------|-----------------|
| `apps/api/` | Render (Web Service, native Bun runtime) | Push to `master` → Render's GitHub integration auto-builds and deploys |
| `apps/web/` | Cloudflare Pages | Already set up (project `interis`) — push to `master` auto-builds and deploys |
| `apps/docs/` | Cloudflare Pages | Already set up (project `interis-docs`) — push to `master` auto-builds and deploys |
| DB migrations | Neon | Runs as Render's Pre-Deploy Command, before each deploy |

`apps/api/` previously ran on Cloudflare Workers. Moved to Render because several of Workers' isolate-model constraints (no native crypto, a hard PBKDF2 iteration cap, a 128MB memory ceiling that can't be raised on any plan, and a DB driver forced from pooled TCP to per-request HTTP) kept causing production-only failures that never reproduced locally. Hono itself was never the problem — it's runtime-agnostic and needed zero route/logic changes to move; this was purely a hosting change. See git history around July 2026 for the full story if you need it.

**Never run `bun run start` against production from your own machine.** Push to GitHub and let Render's Git integration pick it up. This keeps "what's live" always traceable to a commit on `master`.

---

## Render setup

Render Web Service, native runtime (not Docker — the existing `apps/api/Dockerfile` still works if you ever want to switch to Docker-based deploys, but native runtime is simpler and Render supports Bun directly):

| Field | Value |
|---|---|
| Root Directory | `apps/api` |
| Build Command | `bun install` |
| Start Command | `bun run start` |
| Health Check Path | `/api/health` |
| Pre-Deploy Command | `bunx drizzle-kit migrate` |

Don't use `bun run scripts/docker-migrate.ts` here — that script is hardcoded to `DIRECT_DATABASE_URL` specifically to work around docker-compose's local Postgres proxy, and doesn't apply to a direct Neon connection. Plain `drizzle-kit migrate` (which uses `DATABASE_URL` and the neon-serverless driver) is correct for Render.

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

Everything else (`AUTH_ACCESS_COOKIE_NAME`, `AUTH_REFRESH_COOKIE_NAME`, `JWT_ACCESS_TTL_SECONDS`, `REFRESH_TOKEN_TTL_SECONDS`, `USE_LOCAL_DB_PROXY`) has a safe default in `env.ts` and doesn't need to be set explicitly in production.

### Local development

`apps/api/.env` mirrors this list (gitignored). `bun run dev` for local work — nothing Render-specific to install or run locally.

---

## DNS cutover (one-time, from the Workers era)

`api.interis.gorkemkaryol.dev` was bound to the Cloudflare Worker as a Custom Domain route. To point it at Render instead:

1. Remove the Custom Domain route from the Worker's Settings → Domains & Routes in the Cloudflare dashboard.
2. Add the custom domain in Render's dashboard for this service, and follow its DNS instructions (typically a CNAME record in the `gorkemkaryol.dev` zone).

`apps/web` has no hardcoded Workers URLs anywhere — it just talks to `api.interis.gorkemkaryol.dev`, so no frontend changes are needed once DNS points there.

---

## Password hashing: Bun.password → PBKDF2 + WASM argon2id

This predates the Render move and is **no longer strictly necessary** now that the Workers constraints that caused it are gone (Render's Bun runtime has native `Bun.password`, no PBKDF2 cap, no WASM restrictions) — kept as-is because it already works correctly under plain Bun too, not because it's still required. Simplifying back to native `Bun.password` is a reasonable follow-up cleanup if anyone wants to remove the `argon2id` dependency, but isn't blocking anything.

`Bun.password.hash/verify` (argon2id) only exists in the Bun runtime — there was no equivalent under Cloudflare Workers' `workerd` runtime, which is why this exists at all.

`src/modules/auth/services/password.service.ts`:

- **Hashes new passwords with PBKDF2-SHA256** (100,000 iterations — capped there for the old Workers deployment; Bun/Render has no such cap, so this could be raised) via native `crypto.subtle`.
- **Still verifies existing `$argon2id$...` hashes** (anything hashed before the Hono/Workers migration) using the [`argon2id`](https://www.npmjs.com/package/argon2id) npm package — confirmed byte-for-byte compatible with `Bun.password`'s output. On a successful legacy verify, the caller (`AuthService`) immediately re-hashes with PBKDF2 and overwrites the stored hash, so every account converges onto pbkdf2-sha256 after its next login — no bulk migration needed.

A `.wasm` import's shape differs by runtime — Bun's gives back the file path as a string (not bytes or a precompiled Module), which needed explicit handling. See `instantiateWasmModule`'s comment in `password.service.ts` if you touch this code; it's exercised by `bun test`.

---

## Lessons worth keeping in mind (found the hard way, still apply)

### `z.coerce.boolean()` and any other stringly-typed env var

`z.coerce.boolean()` (in `env.ts`, zod v4) uses JavaScript's `Boolean(value)` semantics, not string parsing — `Boolean("false")` is `true`, because any non-empty string is truthy. Every env var arrives as a literal string regardless of source, so declaring `SOME_FLAG=false` anywhere would silently evaluate to `true`. This broke `USE_LOCAL_DB_PROXY` in production for a while. Fixed by switching to `z.stringbool()`, which parses `"true"`/`"false"` as actual booleans. If you add another boolean env var to `env.ts`, use `z.stringbool()`, not `z.coerce.boolean()`.

### Don't trust local dev to reproduce every production failure mode

Several bugs this migration surfaced (the PBKDF2 iteration cap, the WASM codegen restriction, the 128MB memory cap) only ever showed up against real Cloudflare infrastructure — `wrangler dev`'s local simulator silently didn't enforce any of them. Render's a more traditional long-running process, so this specific class of surprise should mostly go away, but it's a good reminder generally: a clean local run isn't proof a deploy target's real constraints are satisfied.

---

## Local Development

```bash
cd apps/api
bun install
bun run dev         # Bun.serve, http://localhost:5000
```
