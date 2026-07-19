import type { Context } from "hono";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import { sendNotFound, sendValidationError } from "../../commons/http/validation-response.hono";
import { DiaryService } from "./diary.service";
import { CreateDiarySchema, UpdateDiarySchema } from "./dto/diary.dto";

export class DiaryController {
  static async getMyDiary(c: Context<AppEnv>): Promise<Response> {
    const entries = await DiaryService.findAllByUser(c.get("user").id);
    return c.json(entries, 200);
  }

  static async create(c: Context<AppEnv>): Promise<Response> {
    const parsed = CreateDiarySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const result = await DiaryService.create(c.get("user").id, parsed.data);
    return c.json(result, 201);
  }

  static async update(c: Context<AppEnv>): Promise<Response> {
    const parsed = UpdateDiarySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const updated = await DiaryService.update(
      c.req.param("id") as string,
      c.get("user").id,
      parsed.data,
    );
    if (!updated) {
      return sendNotFound(c, "Diary entry not found");
    }

    return c.json(updated, 200);
  }

  static async remove(c: Context<AppEnv>): Promise<Response> {
    const deleted = await DiaryService.delete(c.req.param("id") as string, c.get("user").id);
    if (!deleted) {
      return sendNotFound(c, "Diary entry not found");
    }

    return c.json({ success: true }, 200);
  }
}
