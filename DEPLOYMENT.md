# Deployment

## Overview

| Layer | Platform | How it deploys |
|-------|----------|-----------------|
| `apps/api/` | Cloudflare Workers | Push to `master` → Cloudflare's GitHub integration auto-builds and deploys |
| `apps/web/` | Cloudflare Pages | Already set up (project `interis`) — push to `master` auto-builds and deploys |
| `apps/docs/` | Cloudflare Pages | Already set up (project `interis-docs`) — push to `master` auto-builds and deploys |
| DB migrations | Neon | Manual — run locally via `drizzle-kit` |

`apps/web/` and `apps/docs/` already deploy via Cloudflare Pages, configured outside this repo (Cloudflare dashboard). This doc covers `apps/api/`'s Workers setup, which is new.

**Never run `bun run cf:deploy` (`wrangler deploy`) from the CLI for this project.** Push to GitHub and let Cloudflare's Git integration pick it up. This keeps "what's live" always traceable to a commit on `master`, with no deploys that only exist on someone's machine.

---

## Why Cloudflare Workers works here

The API was already Hono-based with an edge-friendly dependency set before this migration:

- **DB**: `@neondatabase/serverless` talks to Neon over HTTP, not the Postgres wire protocol — no TCP socket needed, which Workers can't open.
- **Auth**: JWTs are signed/verified with `jose` (WebCrypto-based, not a native binding).
- **IDs/hashing**: `node:crypto`'s `randomUUID`/`randomBytes`/`createHash` are covered by the `nodejs_compat` compatibility flag.
- **Storage**: R2 access goes through the S3-compatible API via `@aws-sdk/client-s3`, which also works fine under `nodejs_compat`.

The one piece that didn't carry over: password hashing. See below.

## Password hashing: Bun.password → PBKDF2

`Bun.password.hash/verify` (argon2id) only exists in the Bun runtime — there's no equivalent under Workers' `workerd` runtime. WASM-based argon2 libraries (`hash-wasm`, etc.) don't work either: Workers disallows dynamic `WebAssembly.compile()`/`instantiate()` from an in-memory buffer, which is exactly how those libraries load their WASM binary (confirmed by testing directly under `wrangler dev` — see `PasswordService`'s inline comments for the details). A pure-JS argon2 implementation (`@noble/hashes`) does run, but at ~900ms–3s per hash even with light parameters — unusable for a per-request login path.

`src/modules/auth/services/password.service.ts` now:

- **Hashes new passwords with PBKDF2-SHA256** (210,000 iterations) via native `crypto.subtle` — confirmed ~46ms under `wrangler dev`, well within Workers' CPU budget, and an OWASP-endorsed KDF.
- **Still verifies existing `$argon2id$...` hashes** (anything hashed before this migration) via the pure-JS `@noble/hashes` fallback — confirmed byte-for-byte compatible with `Bun.password`'s output. This path is slow (~1s), so on a successful legacy verify the caller (`AuthService`) immediately re-hashes with PBKDF2 and overwrites the stored hash. Each existing account pays the slow path at most once, on its next login.

No manual data migration is needed — this happens lazily, in place, as users log in.

---

## Environment Variables

### API — Cloudflare Workers Dashboard

Set these under Workers → Settings → Variables and Secrets, as **Secrets** (encrypted at rest), not plaintext variables:

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Neon connection string |
| `JWT_ACCESS_SECRET` | 32+ chars |
| `TMDB_ACCESS_TOKEN` | Include the `Bearer ` prefix, same as `.env` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Only needed if avatar uploads are enabled |
| `CORS_ORIGIN` | The deployed web app's origin(s), comma-separated |

`apps/api/wrangler.toml` sets `keep_vars = true`, so deploys never erase whatever's set in the dashboard. Everything else (`NODE_ENV`, cookie names, token TTLs) is checked into `wrangler.toml`'s `[vars]` block since none of it is sensitive.

### Local development (`wrangler dev`)

`apps/api/.dev.vars` mirrors `apps/api/.env`'s keys (gitignored, same as `.env`). Run `bun run cf:dev` from `apps/api/` to test against the real Workers runtime locally — this is a local `workerd` simulator, it never touches Cloudflare's servers.

---

## First-Time Setup (when you're ready to go live)

1. In the Cloudflare dashboard, create a Worker and connect it to this GitHub repo via the Git integration, pointed at `apps/api/` with `master` as the deploy branch.
2. Add the Secrets listed above under the Worker's Settings → Variables and Secrets.
3. Push to `master` to trigger the first deploy.
4. DB migrations are **not** run by the Worker — run `bunx drizzle-kit migrate` locally (or from CI) against the same `DATABASE_URL` before/alongside a deploy that needs a new migration.

---

## Local Development (unchanged)

Bun is still the primary local dev runtime — `wrangler dev` is for verifying Workers compatibility, not day-to-day development:

```bash
cd apps/api
bun install
bun run dev         # Bun.serve, http://localhost:5000 — main local workflow
bun run cf:dev       # wrangler dev, local workerd simulator — Workers verification only
```
