import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    env: {
      VITE_API_BASE_URL: "http://localhost",
    },
    // Custom wrapper around jsdom that restores Node's native fetch/
    // AbortController globals after jsdom installs its own incompatible
    // versions - see the file for why this is necessary for MSW-backed
    // network calls to work under jsdom. See also tests/support/setup.ts.
    environment: "./tests/support/environments/jsdom-native-fetch.ts",
    setupFiles: ["./tests/support/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    clearMocks: true,
    restoreMocks: true,
    css: true,
    globals: true,
  },
});
