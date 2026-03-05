import express, { type Request, type Response } from "express";
import cors from "cors";
import pino from "pino-http";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./infrastructure/auth/auth";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: ["http://localhost:5173", "https://cinema.gorkemkaryol.dev"],
    credentials: true, 
  })
);

app.use(pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "pid,hostname",
    },
  },
}));

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Express backend is alive on Bun!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
});