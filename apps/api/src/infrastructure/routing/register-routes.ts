import type { Express } from "express";
import authRouter from "../../modules/auth/auth.routes";

export const registerRoutes = (app: Express): void => {
  app.use("/api/auth", authRouter);
};
