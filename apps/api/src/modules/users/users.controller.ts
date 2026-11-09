import type { Request, Response } from "express";
import { resolveViewerUserIdFromHeaders } from "../../commons/auth/session-resolver.helper";
import {
  resolveOrNotFound,
  sendNotFound,
  sendValidationError,
} from "../../commons/http/validation-response.helper";
import { UsersService } from "./users.service";
import {
  SearchUsersQuerySchema,
  UpdateProfileSchema,
  UpdateThemeSchema,
  type SearchUsersQueryDto,
} from "./dto/users.dto";

export class UsersController {
  static async getNetworkStats(_req: Request, res: Response): Promise<void> {
    const stats = await UsersService.getNetworkStats();
    res.status(200).json(stats);
  }

  static async search(
    req: Request<{}, {}, {}, SearchUsersQueryDto>,
    res: Response,
  ): Promise<void> {
    const parsed = SearchUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const users = await UsersService.searchUsers(parsed.data.query, parsed.data.limit);
    res.status(200).json(users);
  }

  static async getProfile(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    const profile = await resolveOrNotFound(res, "User not found", () =>
      UsersService.getPublicProfileWithStats(req.params.username),
    );
    if (!profile) {
      return;
    }
    res.status(200).json(profile);
  }

  static async getDetailedStats(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    const profile = await resolveOrNotFound(res, "User not found", () =>
      UsersService.findByUsername(req.params.username),
    );
    if (!profile) {
      return;
    }
    const stats = await UsersService.getDetailedStats(profile.id);
    res.status(200).json(stats);
  }

  static async getUserReviewDetail(
    req: Request<{ username: string; reviewId: string }>,
    res: Response,
  ): Promise<void> {
    const profile = await resolveOrNotFound(res, "User not found", () =>
      UsersService.findByUsername(req.params.username),
    );
    if (!profile) {
      return;
    }

    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);
    const review = await UsersService.getReviewDetailByUsername(
      req.params.username,
      req.params.reviewId,
      viewerUserId,
    );

    if (!review) {
      sendNotFound(res, "Review not found");
      return;
    }

    res.status(200).json(review);
  }

  static async getMe(req: Request, res: Response): Promise<void> {
    const profile = await UsersService.findById(req.user.id);
    if (!profile) {
      sendNotFound(res, "Profile not found");
      return;
    }
    res.status(200).json(profile);
  }

  static async getMeSummary(req: Request, res: Response): Promise<void> {
    const summary = await UsersService.getMeSummary(req.user.id);
    if (!summary) {
      sendNotFound(res, "Profile not found");
      return;
    }

    res.status(200).json(summary);
  }

  static async updateMe(req: Request, res: Response): Promise<void> {
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const updated = await UsersService.updateProfile(req.user.id, parsed.data);
    res.status(200).json(updated);
  }

  static async updateTheme(req: Request, res: Response): Promise<void> {
    const parsed = UpdateThemeSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const updated = await UsersService.updateTheme(
      req.user.id,
      parsed.data.themeId,
    );

    if (!updated) {
      sendNotFound(res, "User not found");
      return;
    }

    res.status(200).json(updated);
  }
}
