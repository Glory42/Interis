import { Hono } from "hono";
import type { AppEnv } from "./infrastructure/http/hono-context.types";
import { logger } from "./commons/utils/logger";
import { env } from "./infrastructure/config/env";
import { onError } from "./commons/errors/onError.hono";
import { secureHeadersMiddleware } from "./commons/middlewares/secureHeaders.hono";
import {
  publicCorsMiddleware,
  createTrustedOriginCorsMiddleware,
} from "./commons/middlewares/cors.hono";
import { requestLoggerMiddleware } from "./commons/middlewares/requestLogger.hono";
import { requireTrustedOriginForMutations } from "./commons/middlewares/requireTrustedOriginForMutations.hono";
import {
  createAuthLimiter,
  createApiLimiter,
  createMutationLimiter,
} from "./commons/middlewares/rateLimiters.hono";
import { getTrustedOriginsFromEnv } from "./infrastructure/config/origins";
import { registerHonoRoutes } from "./infrastructure/routing/register-hono-routes";

export type RateLimiterOverrides = {
  auth?: number;
  api?: number;
  mutation?: number;
};

export type CreateAppOptions = {
  rateLimiterOverrides?: RateLimiterOverrides;
};

export const createApp = (options: CreateAppOptions = {}): Hono<AppEnv> => {
  const app = new Hono<AppEnv>();
  const trustedOrigins = getTrustedOriginsFromEnv();

  app.onError(onError);

  app.use("*", secureHeadersMiddleware);

  app.use("/api/public/*", publicCorsMiddleware);
  app.use("*", ...createTrustedOriginCorsMiddleware(trustedOrigins));

  app.use("*", requestLoggerMiddleware);

  app.use("/api/*", createApiLimiter(options.rateLimiterOverrides?.api));
  app.use("/api/*", createMutationLimiter(options.rateLimiterOverrides?.mutation));
  app.use("*", requireTrustedOriginForMutations(trustedOrigins));
  app.use("/api/auth/*", createAuthLimiter(options.rateLimiterOverrides?.auth));

  registerHonoRoutes(app);

  app.get("/", (c) => c.json({ status: "ok", message: "Hello Zeytin" }));

  return app;
};

export const startServer = () => {
  const app = createApp();
  const port = env.PORT;

  const server = Bun.serve({ fetch: app.fetch, port });
  logger.info(`🚀 Hono server running on http://localhost:${server.port}`);

  let isShuttingDown = false;

  const shutdown = (signal: string) => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    logger.info(`${signal} received, shutting down gracefully`);
    server.stop();
    logger.info("Server closed, exiting");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return server;
};

if (import.meta.main) {
  startServer();
}
