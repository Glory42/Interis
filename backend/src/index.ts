import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./infrastructure/auth/auth";
import { logger } from "./commons/utils/logger";
import moviesRouter from "./modules/movies/movies.routes";
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

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  app.use(
    pinoHttp({
      transport: {
        target: "pino-pretty",
        options: { colorize: true, ignore: "pid,hostname" },
      },
    }),
  );

  app.all("/api/auth/*splat", toNodeHandler(auth));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (req: Request, res: Response) => {
    res.json({ status: "ok", message: "Hello Zeytin" });
  });

  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", message: "Arkheion API is alive" });
  });

  app.use("/api/movies", moviesRouter);
  app.use("/api/diary", diaryRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/social", socialRouter);
  app.use("/api/interactions", interactionsRouter);
  app.use("/api/uploads", uploadsRouter);
  app.use("/api/public", publicRouter);
  app.use("/api/posts", postsRouter);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
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
