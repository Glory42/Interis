import type { Request, Response } from "express";
import { z } from "zod";
import { DiaryService } from "./diary.service";
import { CreateDiarySchema, UpdateDiarySchema } from "./dto/diary.dto";

export class DiaryController {
  static async getMyDiary(req: Request, res: Response): Promise<void> {
    const entries = await DiaryService.findAllByUser(req.user.id);
    res.status(200).json(entries);
  }

  static async create(req: Request, res: Response): Promise<void> {
    const parsed = CreateDiarySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: z.flattenError(parsed.error) });
      return;
    }

    const result = await DiaryService.create(req.user.id, parsed.data);
    res.status(201).json(result);
  }

  static async update(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const parsed = UpdateDiarySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: z.flattenError(parsed.error) });
      return;
    }

    const updated = await DiaryService.update(
      req.params.id,
      req.user.id,
      parsed.data,
    );
    if (!updated) {
      res.status(404).json({ error: "Diary entry not found" });
      return;
    }

    res.status(200).json(updated);
  }

  static async remove(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const deleted = await DiaryService.delete(req.params.id, req.user.id);
    if (!deleted) {
      res.status(404).json({ error: "Diary entry not found" });
      return;
    }

    res.status(200).json({ success: true });
  }
}
