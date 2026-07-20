import type { ExecutionContext, Hono } from "hono";
import type { AppEnv } from "./infrastructure/http/hono-context.types";

// Workers bindings only exist as the `env` argument passed to fetch(), but
// the app reads config eagerly off `process.env` at module-import time - so
// that import has to happen after `env` is copied in below. A dynamic
// import achieves that and is cached for every request after the first.
let appPromise: Promise<Hono<AppEnv>> | null = null;

const getApp = (workerEnv: Record<string, string | undefined>): Promise<Hono<AppEnv>> => {
  if (!appPromise) {
    Object.assign(process.env, workerEnv);
    appPromise = import("./index").then(({ createApp }) => createApp());
  }

  return appPromise;
};

export default {
  fetch: async (
    request: Request,
    workerEnv: Record<string, string | undefined>,
    ctx: ExecutionContext,
  ): Promise<Response> => {
    try {
      const app = await getApp(workerEnv);
      return app.fetch(request, workerEnv, ctx);
    } catch (err) {
      // A startup failure (e.g. a missing binding) throws during the
      // dynamic import above, outside the app's own error handling - left
      // uncaught, Cloudflare shows an opaque "error 1101" instead. Log the
      // real cause without leaking it to the caller.
      console.error(err);
      return new Response(
        JSON.stringify({
          error: { message: "Service misconfigured", code: "STARTUP_ERROR" },
        }),
        { status: 503, headers: { "content-type": "application/json" } },
      );
    }
  },
};
