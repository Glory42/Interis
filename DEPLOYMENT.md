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

## Password hashing: Bun.password → PBKDF2 + WASM argon2id

`Bun.password.hash/verify` (argon2id) only exists in the Bun runtime — there's no equivalent under Workers' `workerd` runtime.

`src/modules/auth/services/password.service.ts` now:

- **Hashes new passwords with PBKDF2-SHA256** (210,000 iterations) via native `crypto.subtle` — confirmed ~46ms under `wrangler dev`, well within Workers' CPU budget, and an OWASP-endorsed KDF.
- **Still verifies existing `$argon2id$...` hashes** (anything hashed before this migration) using the [`argon2id`](https://www.npmjs.com/package/argon2id) npm package — confirmed byte-for-byte compatible with `Bun.password`'s output, ~200–300ms. On a successful legacy verify, the caller (`AuthService`) immediately re-hashes with PBKDF2 and overwrites the stored hash, so every account converges onto pbkdf2-sha256 after its next login — no bulk migration needed.

### Why this specific package, and what didn't work first

Most WASM argon2 libraries fail outright on Workers: Cloudflare disallows dynamic `WebAssembly.compile()`/`instantiate()` from an in-memory buffer (confirmed directly — `hash-wasm` throws `CompileError: Wasm code generation disallowed by embedder`). A pure-JS argon2 implementation (`@noble/hashes`) does run, but costs ~900ms–3s of actual CPU/memory even with light parameters — that's not just slow, it's memory-hungry enough that it hit Cloudflare's hard 128MB-per-isolate memory cap in production (`error code: 1102`, "Worker exceeded resource limits") on accounts with heavier stored hash parameters. Unlike the CPU time limit, **the memory cap can't be raised on any plan.**

`argon2id` sidesteps both problems: it ships real `.wasm` asset files (`dist/simd.wasm`, `dist/no-simd.wasm`) meant to be imported as ES modules — `import wasm from 'argon2id/dist/simd.wasm'` — so wrangler's own bundler precompiles them at build time into a `WebAssembly.Module`, never triggering the dynamic-codegen restriction. Genuine WASM execution is also far lighter on memory than the equivalent pure-JS computation, which is what actually fixed the 1102s.

One wrinkle worth knowing if you touch this code: a `.wasm` import's shape differs by runtime — wrangler's bundler gives a precompiled `WebAssembly.Module`, Bun's gives back the file path as a string (not bytes), and each needs different handling before `WebAssembly.instantiate()` will accept it. See `instantiateWasmModule`'s comment in `password.service.ts` — this is exercised by both `bun test` and `wrangler dev`, so a regression here fails in either.

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

This is "Workers Builds" (Cloudflare's Git-integration CI/CD for Workers) — a
different product from the Cloudflare Pages setup `apps/web`/`apps/docs`
already use, but configured the same way: connect the repo, point it at a
subdirectory, push to deploy.

1. In the Cloudflare dashboard, create a Worker → connect it to this GitHub repo.
2. **Root directory: `apps/api`** — this is what tells Workers Builds where `wrangler.toml` lives in the monorepo.
3. **Worker name must exactly match `wrangler.toml`'s `name` field: `interis`.** Cloudflare requires these to match or the build fails — set it when creating the Worker, don't let it default to the repo name. (If it doesn't match, either rename the Worker or edit `wrangler.toml`'s `name` to fit — whichever's already live wins.)
4. Production branch: `master`. Leave the build command empty (no compile step — Workers Builds bundles `src/worker.ts` directly via Wrangler). **Explicitly set the deploy command to `npx wrangler deploy`** — don't assume the default: in practice this dashboard showed `npx wrangler versions upload` even with `master` set as the production branch, which uploads a version but never routes traffic to it. Check the actual value under Settings → Build → Build configuration, not just what the docs say it should default to.
5. Add the Secrets listed above **under the Worker's Settings → Variables and Secrets** (the top-level one, not the one under the Build section — see the warning below), **before** the first deploy (a deploy will crash-loop on missing `DATABASE_URL`/`JWT_ACCESS_SECRET`/`TMDB_ACCESS_TOKEN` — `env.ts` fails closed).
6. Push to `master` (or trigger a rebuild from the dashboard) to fire the first deploy.
7. DB migrations are **not** run by the Worker — run `bunx drizzle-kit migrate` locally (or from CI) against the same `DATABASE_URL` before/alongside a deploy that needs a new migration.

---

## Troubleshooting

Real pitfalls hit setting this up — check these before assuming something's fundamentally broken.

### Two dashboard panels are both called "Variables and secrets" — they are not the same thing

The Worker's settings page has a top-level **"Variables and secrets" panel** (labeled *"used at runtime"*) and a separate one nested under **Settings → Build → Build configuration**. Only the top-level one is what the deployed Worker actually sees at request time — the Build one is only visible to the build step itself (relevant for frameworks that need env vars at build time, e.g. Next.js static generation; irrelevant here, since Wrangler bundles this app with no build step). Adding a var only to the Build panel — the easy mistake, since it's right next to the deploy command you're also configuring — silently produces a Worker that builds and deploys "successfully" but 500s/hangs on every request touching that var. Always add secrets to the top-level runtime panel.

While you're in there, add `DATABASE_URL`, `JWT_ACCESS_SECRET`, `TMDB_ACCESS_TOKEN`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY` as **Secret** type, not **Plaintext**/Variable — Plaintext values get printed in cleartext in build logs (e.g. in the `wrangler deploy` config-diff warning on every deploy), Secrets don't.

### `z.coerce.boolean()` and any other stringly-typed env var

`z.coerce.boolean()` (in `env.ts`, zod v4) uses JavaScript's `Boolean(value)` semantics, not string parsing — `Boolean("false")` is `true`, because any non-empty string is truthy. Since every env var arrives as a literal string regardless of source (`.env`, `.dev.vars`, `wrangler.toml`'s `[vars]`, or a dashboard Variable), declaring `SOME_FLAG = "false"` anywhere would silently evaluate to `true`. This broke `USE_LOCAL_DB_PROXY` in production for a while — a deploy with `wrangler.toml`'s checked-in `USE_LOCAL_DB_PROXY = "false"` was coercing to `true`, which pointed every DB query at a local proxy host that only exists inside `docker-compose`, hanging every DB-touching request until timeout. Fixed by switching to `z.stringbool()`, which parses `"true"`/`"false"` as actual booleans. If you add another boolean env var to `env.ts`, use `z.stringbool()`, not `z.coerce.boolean()`.

### Cloudflare error 1101 ("Worker threw exception") vs 1102 ("exceeded resource limits")

**1101** means something threw during the Worker's startup/module-eval path, outside the app's own routing — `worker.ts`'s `fetch` handler catches this and returns a clean `503 {"code":"STARTUP_ERROR"}` instead, logging the real cause (check `wrangler tail` or the dashboard's Logs tab — enable Logs under Observability if it's off, it's disabled by default). If you see a raw 1101 page instead of that 503, the crash is happening somewhere `worker.ts`'s try/catch doesn't cover — worth investigating as a gap, not just retrying.

**1102** means the Worker hit its CPU time or memory limit — this is what legacy `$argon2id$` verification hit before switching to the WASM `argon2id` package (see above). CPU time defaults to 30s on the paid usage model and is raisable; the 128MB memory cap is not raisable on any plan, so if you see 1102 the fix is almost always "use less memory," not "raise a limit."

---

## Local Development (unchanged)

Bun is still the primary local dev runtime — `wrangler dev` is for verifying Workers compatibility, not day-to-day development:

```bash
cd apps/api
bun install
bun run dev         # Bun.serve, http://localhost:5000 — main local workflow
bun run cf:dev       # wrangler dev, local workerd simulator — Workers verification only
```
