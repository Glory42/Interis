import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./infrastructure/auth/auth";
import { logger } from "./commons/utils/logger";
import { env } from "./infrastructure/config/env";
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
import listsRouter from "./modules/lists/lists.routes";
import moviesRouter from "./modules/movies/movies.routes";
import serialsRouter from "./modules/serials/serials.routes";
import peopleRouter from "./modules/people/people.routes";
import diaryRouter from "./modules/diary/diary.routes";
import usersRouter from "./modules/users/users.routes";
import reviewsRouter from "./modules/reviews/reviews.routes";
import socialRouter from "./modules/social/social.routes";
import interactionsRouter from "./modules/interactions/interactions.routes";
import uploadsRouter from "./modules/uploads/uploads.routes";
import publicRouter from "./modules/public/public.routes";
import postsRouter from "./modules/posts/posts.routes";
import dataTransferRouter from "./modules/data-transfer/data-transfer.routes";

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
        res.setHeader("x-request-id", requestId);
        return requestId;
      },
    }),
  );

  app.use("/api", apiLimiter);
  app.use("/api", mutationLimiter);
  app.use(requireTrustedOriginForMutations(trustedOrigins));
  app.use("/api/auth", authLimiter);
  // Bounded JSON parsing ahead of the auth handler — Better Auth's node
  // adapter reads req.body directly when Express has already parsed it, so
  // this both enforces a size limit and works transparently.
  app.use("/api/auth", express.json({ limit: "20kb" }));
  app.all("/api/auth/*splat", toNodeHandler(auth));

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.get("/", (req: Request, res: Response) => {
    res.json({ status: "ok", message: "Hello Zeytin" });
  });

  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", message: "Interis API is alive" });
  });

  app.use("/api/movies", moviesRouter);
  app.use("/api/serials", serialsRouter);
  app.use("/api/people", peopleRouter);
  app.use("/api/diary", diaryRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/social", socialRouter);
  app.use("/api/interactions", interactionsRouter);
  app.use("/api/uploads", uploadsRouter);
  app.use("/api/public", publicRouter);
  app.use("/api/posts", postsRouter);
  app.use("/api/lists", listsRouter);
  app.use("/api/data", dataTransferRouter);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err.message === "Not allowed by CORS") {
      res.status(403).json({ error: "Origin is not allowed" });
      return;
    }

    const bodyParserError = err as Error & { type?: string; status?: number };
    if (bodyParserError.type === "entity.too.large") {
      res.status(413).json({ error: "Request body too large" });
      return;
    }
    if (bodyParserError.type?.startsWith("entity.parse")) {
      res.status(400).json({ error: "Malformed request body" });
      return;
    }

    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
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
