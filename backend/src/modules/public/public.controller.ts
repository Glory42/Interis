import type { Request, Response } from "express";
import { PublicService } from "./public.service";

export class PublicController {
  // GET /api/public/:username/recent?limit=10
  static async getRecent(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const data = await PublicService.getRecentActivity(
      req.params.username,
      limit,
    );

    if (!data) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Cache for 5 minutes — portfolio widget doesn't need real-time
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).json(data);
  }

  // GET /api/public/:username/top4
  static async getTop4(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    const data = await PublicService.getTop4(req.params.username);

    if (!data) {
      res.status(404).json({ error: "User not found or no top 4 set" });
      return;
    }

    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).json(data);
  }

  // GET /api/public/:username/stats
  static async getStats(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    const data = await PublicService.getStats(req.params.username);

    if (!data) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).json(data);
  }
}
