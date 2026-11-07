import type { Request, Response } from "express";
import { AdminOverviewService } from "./admin-overview.service";

export class AdminOverviewController {
  // GET /api/admin/overview
  static async get(_req: Request, res: Response): Promise<void> {
    res.status(200).json(await AdminOverviewService.getOverview());
  }
}
