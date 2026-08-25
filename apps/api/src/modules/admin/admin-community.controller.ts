import type { Request, Response } from "express";
import { sendNotFound, sendValidationError } from "../../commons/http/validation-response.helper";
import { AdminCommunityService } from "./admin-community.service";
import {
  AdminListActivitiesQuerySchema,
  AdminListListsQuerySchema,
  type AdminListActivitiesQuery,
  type AdminListListsQuery,
} from "./dto/admin-community.dto";

export class AdminCommunityController {
  static async listLists(
    req: Request<{}, {}, {}, AdminListListsQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = AdminListListsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const lists = await AdminCommunityService.listLists(
      parsed.data.username,
      parsed.data.limit ?? 20,
      parsed.data.offset ?? 0,
    );
    res.status(200).json(lists);
  }

  static async deleteList(req: Request<{ id: string }>, res: Response): Promise<void> {
    const result = await AdminCommunityService.deleteList(req.params.id);
    if (!result.deleted) {
      sendNotFound(res, "List not found");
      return;
    }
    res.status(200).json({ success: true });
  }

  static async listActivities(
    req: Request<{}, {}, {}, AdminListActivitiesQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = AdminListActivitiesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const activities = await AdminCommunityService.listActivities(
      { username: parsed.data.username, type: parsed.data.type },
      parsed.data.limit ?? 20,
      parsed.data.offset ?? 0,
    );
    res.status(200).json(activities);
  }

  static async deleteActivity(req: Request<{ id: string }>, res: Response): Promise<void> {
    const deleted = await AdminCommunityService.deleteActivity(req.params.id);
    if (!deleted) {
      sendNotFound(res, "Activity not found");
      return;
    }
    res.status(200).json({ success: true });
  }
}
