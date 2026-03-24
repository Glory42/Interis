import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./infrastructure/auth/auth";
import { logger } from "./commons/utils/logger";
import moviesRouter from "./modules/movies/movies.route";
import diaryRouter from "./modules/diary/diary.routes";
import usersRouter from "./modules/users/users.route";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Hello Zeytin" });
});

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Express backend is alive on Bun!" });
});

app.use("/api/movies", moviesRouter);
app.use("/api/diary", diaryRouter);
app.use("/api/users", usersRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  logger.info(`🚀 Express server running on http://localhost:${PORT}`);
});
