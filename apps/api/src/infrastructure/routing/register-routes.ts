import type { Express } from "express";
import adminRouter from "../../modules/admin/admin.routes";
import authRouter from "../../modules/auth/auth.routes";

export const registerRoutes = (app: Express): void => {
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
};
