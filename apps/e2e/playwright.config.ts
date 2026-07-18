import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";
const apiBaseURL = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:5000";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: true,
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
  // Auto-starts both servers for local runs; in CI they're started the same
  // way (env vars are already set at the job level, inherited here) so the
  // journeys exercise the real app instead of a mocked one. Skipped only
  // when E2E_SKIP_WEBSERVER is set, for the rare case both are already
  // running (e.g. manual local debugging against `bun run dev`).
  webServer: process.env.E2E_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: "bun run dev",
          cwd: "../api",
          url: `${apiBaseURL}/api/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
        {
          command: "bun run dev",
          cwd: "../web",
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      ],
});
