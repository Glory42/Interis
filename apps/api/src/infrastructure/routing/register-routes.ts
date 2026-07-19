import type { Express } from "express";
import publicRouter from "../../modules/public/public.routes";
import dataTransferRouter from "../../modules/data-transfer/data-transfer.routes";
import adminRouter from "../../modules/admin/admin.routes";
import authRouter from "../../modules/auth/auth.routes";

export const registerRoutes = (app: Express): void => {
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/public", publicRouter);
  app.use("/api/data", dataTransferRouter);
};
