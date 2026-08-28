import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";
const apiBaseURL = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:5000";
// E2E_BASE_URL/E2E_API_BASE_URL previously only changed the webServer health-
// check URL below, not the port the spawned dev servers actually bind to -
// setting a non-default value would just time out waiting for a server that
// was never told to listen there. Deriving the port to hand each dev server
// keeps this option genuinely usable, e.g. to run an isolated e2e stack
// alongside an already-running local dev server on the default ports.
const webPort = new URL(baseURL).port || "5173";
const apiPort = new URL(apiBaseURL).port || "5000";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: true,
  // CI's webServer spawns one single-threaded `bun run dev` backend and one
  // shared Postgres container for the whole run - full worker parallelism
  // there means N journeys firing concurrent requests at that one process,
  // which was intermittently starving unrelated in-flight requests (most
  // visibly DELETE /api/auth/account, timing out past 60s on a different
  // spec each run - never a real bug in any of them, just whichever
  // request lost the race for the event loop). Serializing in CI trades
  // some wall-clock time for not needing per-request request queueing/
  // pooling tuned well enough to survive full parallelism against a single
  // dev-mode server. Local runs keep full parallelism (fine there: no CI
  // resource contention, and reuseExistingServer means CI's Postgres/
  // server bottleneck doesn't apply the same way against a dev machine).
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Auto-starts both servers so journeys exercise the real app instead of a
  // mock. Skipped only via E2E_SKIP_WEBSERVER, for the rare case both are
  // already running (e.g. manual local debugging against `bun run dev`).
  webServer: process.env.E2E_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: "bun run dev",
          cwd: "../api",
          url: `${apiBaseURL}/api/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
          // Must match baseURL exactly (the browser's real Origin header
          // has to pass requireTrustedOriginForMutations) - previously
          // relied on apps/api/.env's own CORS_ORIGIN, which silently
          // breaks the moment baseURL differs from whatever's in that
          // file (e.g. a custom E2E_BASE_URL, or just localhost vs
          // 127.0.0.1 - the default baseURL is 127.0.0.1, and .env's
          // documented default is "localhost", which are different
          // origins for CORS purposes).
          env: { PORT: apiPort, CORS_ORIGIN: baseURL },
        },
        {
          // --port/--strictPort so a custom E2E_BASE_URL actually binds
          // there instead of Vite silently falling back to 5173 (or the
          // next free port) when the requested one looks busy.
          command: `bun run dev -- --port ${webPort} --strictPort`,
          cwd: "../web",
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
          env: { VITE_API_PROXY_TARGET: apiBaseURL },
        },
      ],
});
