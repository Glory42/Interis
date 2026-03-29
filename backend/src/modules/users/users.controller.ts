import type { Request, Response } from "express";
import { z } from "zod";
import { UsersService } from "./users.service";
import { UpdateProfileSchema, UpdateThemeSchema } from "./dto/users.dto";

export class UsersController {
  static async getProfile(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    const profile = await UsersService.findByUsername(req.params.username);
    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const stats = await UsersService.getStats(profile.id);
    const { email, ...publicProfile } = profile;
    res.status(200).json({ ...publicProfile, stats });
  }

  static async getUserDiary(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    const profile = await UsersService.findByUsername(req.params.username);
    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const entries = await UsersService.getDiaryWithMovies(profile.id);
    res.status(200).json(entries);
  }

  static async getUserReviews(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    const profile = await UsersService.findByUsername(req.params.username);
    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const userReviews = await UsersService.getReviewsWithMovies(profile.id);
    res.status(200).json(userReviews);
  }

  static async getUserFilms(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    const profile = await UsersService.findByUsername(req.params.username);
    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const films = await UsersService.getWatchedFilms(profile.id);
    res.status(200).json(films);
  }

  static async getUserLikes(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    const profile = await UsersService.findByUsername(req.params.username);
    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const liked = await UsersService.getLikedFilms(profile.id);
    res.status(200).json(liked);
  }

  static async getMe(req: Request, res: Response): Promise<void> {
    const profile = await UsersService.findById(req.user.id);
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.status(200).json(profile);
  }

  static async getMeSummary(req: Request, res: Response): Promise<void> {
    const summary = await UsersService.getMeSummary(req.user.id);
    if (!summary) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    res.status(200).json(summary);
  }

  static async updateMe(req: Request, res: Response): Promise<void> {
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: z.flattenError(parsed.error) });
      return;
    }
    const updated = await UsersService.updateProfile(req.user.id, parsed.data);
    res.status(200).json(updated);
  }

  static async updateTheme(req: Request, res: Response): Promise<void> {
    const parsed = UpdateThemeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: z.flattenError(parsed.error) });
      return;
    }

    const updated = await UsersService.updateTheme(
      req.user.id,
      parsed.data.themeId,
    );

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(updated);
  }
}
