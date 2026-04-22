import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./infrastructure/auth/auth";
import { logger } from "./commons/utils/logger";
import { securityHeaders } from "./commons/middlewares/securityHeaders";
import { requireTrustedOriginForMutations } from "./commons/middlewares/requireTrustedOriginForMutations";
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

export const createApp = () => {
  const app = express();
  const trustedOrigins = getTrustedOriginsFromEnv();

  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith("/public/"),
  });

  app.disable("x-powered-by");
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
  app.use(requireTrustedOriginForMutations(trustedOrigins));
  app.use("/api/auth", authLimiter);
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

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err.message === "Not allowed by CORS") {
      res.status(403).json({ error: "Origin is not allowed" });
      return;
    }

    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
};

export const startServer = () => {
  const app = createApp();
  const port = Number(process.env.PORT ?? 3000);

  return app.listen(port, () => {
    logger.info(`🚀 Express server running on http://localhost:${port}`);
  });
};

if (import.meta.main) {
  startServer();
}
