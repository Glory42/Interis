import type { Request, Response } from "express";
import { z } from "zod";
import { UsersService } from "./users.service";
import { DiaryService } from "../diary/diary.service";

export const UpdateProfileSchema = z.object({
  bio: z.string().max(300).optional(),
  location: z.string().max(100).optional(),
  avatarUrl: z.url().optional(),
  backdropUrl: z.url().optional(),
  top4MovieIds: z.array(z.number().int().positive().max(4)).optional(),
});

export const UpdateUsernameSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username must contain only letters, numbers, and underscores",
    ),
});

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

    const diary = await DiaryService.findAllByUser(profile.id);
    res.status(200).json(diary);
  }

  static async getMe(req: Request, res: Response): Promise<void> {
    const profile = await UsersService.findById(req.user.id);
    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(profile);
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

  static async updateUsername(req: Request, res: Response): Promise<void> {
    const parsed = UpdateUsernameSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: z.flattenError(parsed.error) });
      return;
    }

    const updated = await UsersService.updateUsername(
      req.user.id,
      parsed.data.username,
    );
    if ("error" in updated) {
      res.status(400).json(updated);
      return;
    }

    res.status(200).json(updated);
  }
}
