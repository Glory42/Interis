import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";
import { logger } from "./commons/utils/logger";
import { env } from "./infrastructure/config/env";
import { AppError } from "./commons/errors/app-error";
import { securityHeaders } from "./commons/middlewares/securityHeaders";
import { helmetMiddleware } from "./commons/middlewares/helmet";
import { requireTrustedOriginForMutations } from "./commons/middlewares/requireTrustedOriginForMutations";
import {
  createAuthLimiter,
  createApiLimiter,
  createMutationLimiter,
} from "./commons/middlewares/rateLimiters";
import {
  getTrustedOriginsFromEnv,
  isTrustedOrigin,
} from "./infrastructure/config/origins";
import { registerRoutes } from "./infrastructure/routing/register-routes";
import { registerHonoRoutes } from "./infrastructure/routing/register-hono-routes";

export type RateLimiterOverrides = {
  auth?: number;
  api?: number;
  mutation?: number;
};

export type CreateAppOptions = {
  rateLimiterOverrides?: RateLimiterOverrides;
};

export const createApp = (options: CreateAppOptions = {}) => {
  const app = express();
  const trustedOrigins = getTrustedOriginsFromEnv();
  const authLimiter = createAuthLimiter(options.rateLimiterOverrides?.auth);
  const apiLimiter = createApiLimiter(options.rateLimiterOverrides?.api);
  const mutationLimiter = createMutationLimiter(options.rateLimiterOverrides?.mutation);

  app.disable("x-powered-by");
  app.use(helmetMiddleware);
  app.use(securityHeaders);

  app.use(
    "/api/public",
    cors({
      origin: "*",
      methods: ["GET", "HEAD", "OPTIONS"],
      credentials: false,
    }),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (isTrustedOrigin(origin, trustedOrigins)) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    }),
  );

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const existingId = req.headers["x-request-id"];
        if (typeof existingId === "string" && existingId.length > 0) {
          res.setHeader("x-request-id", existingId);
          return existingId;
        }

        const requestId = randomUUID();
        req.headers["x-request-id"] = requestId;
        res.setHeader("x-request-id", requestId);
        return requestId;
      },
    }),
  );

  app.use("/api", apiLimiter);
  app.use("/api", mutationLimiter);
  app.use(requireTrustedOriginForMutations(trustedOrigins));
  app.use("/api/auth", authLimiter);

  // Modules ported to Hono (issue #30) mount here, ahead of the body
  // parsers below — each is a terminal handler reading its own request
  // body from the raw stream.
  registerHonoRoutes(app);

  // Tighter body-size limit for auth payloads than the rest of the API.
  app.use("/api/auth", express.json({ limit: "20kb" }));

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.get("/", (req: Request, res: Response) => {
    res.json({ status: "ok", message: "Hello Zeytin" });
  });

  registerRoutes(app);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res
        .status(err.statusCode)
        .json({ error: { message: err.message, code: err.code, details: err.details } });
      return;
    }

    if (err.message === "Not allowed by CORS") {
      res
        .status(403)
        .json({ error: { message: "Origin is not allowed", code: "CORS_NOT_ALLOWED" } });
      return;
    }

    const bodyParserError = err as Error & { type?: string; status?: number };
    if (bodyParserError.type === "entity.too.large") {
      res
        .status(413)
        .json({ error: { message: "Request body too large", code: "PAYLOAD_TOO_LARGE" } });
      return;
    }
    if (bodyParserError.type?.startsWith("entity.parse")) {
      res
        .status(400)
        .json({ error: { message: "Malformed request body", code: "MALFORMED_BODY" } });
      return;
    }

    logger.error(err);
    res
      .status(500)
      .json({ error: { message: "Internal server error", code: "INTERNAL_SERVER_ERROR" } });
  });

  return app;
};

export const startServer = () => {
  const app = createApp();
  const port = env.PORT;

  const server = app.listen(port, () => {
    logger.info(`🚀 Express server running on http://localhost:${port}`);
  });

  let isShuttingDown = false;

  const shutdown = (signal: string) => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    logger.info(`${signal} received, shutting down gracefully`);
    server.close((err) => {
      if (err) {
        logger.error(err, "Error while closing server");
        process.exit(1);
      }

      logger.info("Server closed, exiting");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return server;
};

if (import.meta.main) {
  startServer();
}
