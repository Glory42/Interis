import type { ExecutionContext, Hono } from "hono";
import type { AppEnv } from "./infrastructure/http/hono-context.types";

// Workers bindings (vars + secrets) only exist as the `env` argument passed
// to fetch() on each invocation — there's no process-wide startup phase like
// Bun's. The rest of this app (env.ts, db.ts, the TMDB/R2 clients, ...)
// reads configuration eagerly off `process.env` at module-import time, so
// that import has to happen *after* `env` has been copied in below. A
// dynamic import achieves that: the module graph is only evaluated on the
// first request handled by this isolate, and only once — `import()` caches
// the result for every request after that.
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
      // A startup failure (e.g. a missing required binding) throws during
      // the dynamic import above, outside any of the app's own routing/error
      // handling — left uncaught, Cloudflare shows its opaque "error 1101"
      // page instead of anything diagnosable. console.error surfaces the
      // real cause in `wrangler tail`/Workers Logs without leaking it to
      // the caller.
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
