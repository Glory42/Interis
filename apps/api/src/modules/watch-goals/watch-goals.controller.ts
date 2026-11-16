import type { Request, Response } from "express";
import { sendNotFound, sendValidationError } from "../../commons/http/validation-response.helper";
import { SetWatchGoalSchema, WatchGoalYearParamsSchema } from "./dto/watch-goals.dto";
import { WatchGoalsService } from "./watch-goals.service";

// The signed-in user's own goals; reads go through the Profile Tab (GET /api/users/:username/goal).
export class WatchGoalsController {
  // PUT /api/users/me/goal/:year
  static async set(req: Request<{ year: string }>, res: Response): Promise<void> {
    const params = WatchGoalYearParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendValidationError(res, params.error);
      return;
    }
    const body = SetWatchGoalSchema.safeParse(req.body);
    if (!body.success) {
      sendValidationError(res, body.error);
      return;
    }

    const goal = await WatchGoalsService.setGoal(req.user.id, params.data.year, body.data);
    res.status(200).json(goal);
  }

  // DELETE /api/users/me/goal/:year
  static async clear(req: Request<{ year: string }>, res: Response): Promise<void> {
    const params = WatchGoalYearParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendValidationError(res, params.error);
      return;
    }

    const deleted = await WatchGoalsService.clearGoal(req.user.id, params.data.year);
    if (!deleted) {
      sendNotFound(res, "Goal not found");
      return;
    }
    res.status(204).end();
  }
}
