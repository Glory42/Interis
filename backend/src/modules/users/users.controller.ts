import type { Request, Response } from "express";
import { resolveViewerUserIdFromHeaders } from "../../commons/auth/session-resolver.helper";
import { sendValidationError } from "../../commons/http/validation-response.helper";
import { UsersService } from "./users.service";
import {
  SearchUsersQuerySchema,
  UpdateProfileSchema,
  UpdateThemeSchema,
  type SearchUsersQueryDto,
} from "./dto/users.dto";

export class UsersController {
  static async getNetworkStats(_req: Request, res: Response): Promise<void> {
    const totalUsers = await UsersService.getTotalUsersCount();
    res.status(200).json({ totalUsers });
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

  static async getUserReviewDetail(
    req: Request<{ username: string; reviewId: string }>,
    res: Response,
  ): Promise<void> {
    const profile = await UsersService.findByUsername(req.params.username);
    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);
    const review = await UsersService.getReviewDetailByUsername(
      req.params.username,
      req.params.reviewId,
      viewerUserId,
    );

    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    res.status(200).json(review);
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

  static async getUserWatchlist(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    const profile = await UsersService.findByUsername(req.params.username);
    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const watchlist = await UsersService.getWatchlistedFilms(profile.id);
    res.status(200).json(watchlist);
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
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(updated);
  }
}
