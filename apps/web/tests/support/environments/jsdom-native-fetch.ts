import type { Environment } from "vitest/environments";
import { builtinEnvironments } from "vitest/environments";

// jsdom implements its own AbortController/AbortSignal/Headers (a separate,
// pure-JS reimplementation) and installs them over globalThis. Node's
// native fetch (which MSW's node interceptor wraps) validates an incoming
// AbortSignal with a strict instanceof-style brand check against its own
// internal class - jsdom's separately-implemented AbortSignal never
// satisfies that check, so any code that constructs `new AbortController()`
// (as src/lib/api-client.ts always does) and passes its signal to a real
// fetch call crashes with "Expected signal to be an instance of
// AbortSignal", even when MSW is mocking the response. This wraps the
// built-in jsdom environment and restores Node's native fetch-related
// globals afterward so MSW-backed network calls actually work, while
// keeping every other jsdom DOM global untouched.
const jsdomEnvironment = builtinEnvironments.jsdom;

const NATIVE_FETCH_KEYS = ["fetch", "Headers", "Request", "Response", "AbortController", "AbortSignal"] as const;

const environment: Environment = {
  name: "jsdom-native-fetch",
  transformMode: "web",
  async setup(global, options) {
    const natives = new Map<(typeof NATIVE_FETCH_KEYS)[number], unknown>();
    for (const key of NATIVE_FETCH_KEYS) {
      natives.set(key, global[key]);
    }

    const result = await jsdomEnvironment.setup(global, options);

    for (const [key, value] of natives) {
      global[key] = value;
    }

    return result;
  },
};

export default environment;
