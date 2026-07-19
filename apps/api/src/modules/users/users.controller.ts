import type { Context } from "hono";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import { resolveViewerUserIdFromHonoContext } from "../../commons/auth/session-resolver.hono";
import { sendNotFound, sendValidationError } from "../../commons/http/validation-response.hono";
import { ListsService } from "../lists/lists.service";
import { GetUserListsQuerySchema } from "../lists/dto/lists.dto";
import { UsersService } from "./users.service";
import {
  SearchUsersQuerySchema,
  UpdateProfileSchema,
  UpdateThemeSchema,
} from "./dto/users.dto";
import { parseProfileListPagination } from "./helpers/users-pagination.helper";

export class UsersController {
  static async getNetworkStats(c: Context): Promise<Response> {
    const stats = await UsersService.getNetworkStats();
    return c.json(stats, 200);
  }

  static async search(c: Context): Promise<Response> {
    const parsed = SearchUsersQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const users = await UsersService.searchUsers(parsed.data.query, parsed.data.limit);
    return c.json(users, 200);
  }

  static async getProfile(c: Context): Promise<Response> {
    const profile = await UsersService.findByUsername(c.req.param("username") as string);
    if (!profile) {
      return sendNotFound(c, "User not found");
    }
    const stats = await UsersService.getStats(profile.id);
    const { email: _email, ...publicProfile } = profile;
    return c.json({ ...publicProfile, stats }, 200);
  }

  static async getDetailedStats(c: Context): Promise<Response> {
    const profile = await UsersService.findByUsername(c.req.param("username") as string);
    if (!profile) {
      return sendNotFound(c, "User not found");
    }
    const stats = await UsersService.getDetailedStats(profile.id);
    return c.json(stats, 200);
  }

  static async getUserReviews(c: Context): Promise<Response> {
    const profile = await UsersService.findByUsername(c.req.param("username") as string);
    if (!profile) {
      return sendNotFound(c, "User not found");
    }
    const { limit, offset } = parseProfileListPagination(c.req.query());
    const userReviews = await UsersService.getReviewsWithMovies(profile.id, limit, offset);
    return c.json(userReviews, 200);
  }

  static async getUserReviewDetail(c: Context): Promise<Response> {
    const username = c.req.param("username") as string;
    const profile = await UsersService.findByUsername(username);
    if (!profile) {
      return sendNotFound(c, "User not found");
    }

    const viewerUserId = await resolveViewerUserIdFromHonoContext(c);
    const review = await UsersService.getReviewDetailByUsername(
      username,
      c.req.param("reviewId") as string,
      viewerUserId,
    );

    if (!review) {
      return sendNotFound(c, "Review not found");
    }

    return c.json(review, 200);
  }

  static async getUserLikes(c: Context): Promise<Response> {
    const profile = await UsersService.findByUsername(c.req.param("username") as string);
    if (!profile) {
      return sendNotFound(c, "User not found");
    }
    const { limit, offset } = parseProfileListPagination(c.req.query());
    const liked = await UsersService.getLikedFilms(profile.id, limit, offset);
    return c.json(liked, 200);
  }

  static async getUserLikedReviews(c: Context): Promise<Response> {
    const profile = await UsersService.findByUsername(c.req.param("username") as string);
    if (!profile) {
      return sendNotFound(c, "User not found");
    }
    const { limit, offset } = parseProfileListPagination(c.req.query());
    const liked = await UsersService.getLikedReviews(profile.id, limit, offset);
    return c.json(liked, 200);
  }

  static async getUserLikedLists(c: Context): Promise<Response> {
    const profile = await UsersService.findByUsername(c.req.param("username") as string);
    if (!profile) {
      return sendNotFound(c, "User not found");
    }
    const { limit, offset } = parseProfileListPagination(c.req.query());
    const liked = await UsersService.getLikedLists(profile.id, limit, offset);
    return c.json(liked, 200);
  }

  static async getUserWatchlist(c: Context): Promise<Response> {
    const profile = await UsersService.findByUsername(c.req.param("username") as string);
    if (!profile) {
      return sendNotFound(c, "User not found");
    }

    const { limit, offset } = parseProfileListPagination(c.req.query());
    const watchlist = await UsersService.getWatchlistedFilms(profile.id, limit, offset);
    return c.json(watchlist, 200);
  }

  static async getMe(c: Context<AppEnv>): Promise<Response> {
    const profile = await UsersService.findById(c.get("user").id);
    if (!profile) {
      return sendNotFound(c, "Profile not found");
    }
    return c.json(profile, 200);
  }

  static async getMeSummary(c: Context<AppEnv>): Promise<Response> {
    const summary = await UsersService.getMeSummary(c.get("user").id);
    if (!summary) {
      return sendNotFound(c, "Profile not found");
    }

    return c.json(summary, 200);
  }

  static async updateMe(c: Context<AppEnv>): Promise<Response> {
    const parsed = UpdateProfileSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }
    const updated = await UsersService.updateProfile(c.get("user").id, parsed.data);
    return c.json(updated, 200);
  }

  static async updateTheme(c: Context<AppEnv>): Promise<Response> {
    const parsed = UpdateThemeSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const updated = await UsersService.updateTheme(c.get("user").id, parsed.data.themeId);

    if (!updated) {
      return sendNotFound(c, "User not found");
    }

    return c.json(updated, 200);
  }

  static async getUserLists(c: Context): Promise<Response> {
    const parsed = GetUserListsQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const profile = await UsersService.findByUsername(c.req.param("username") as string);
    if (!profile) {
      return sendNotFound(c, "User not found");
    }

    const viewerUserId = await resolveViewerUserIdFromHonoContext(c);
    const publicOnly = viewerUserId !== profile.id;
    const { limit, offset } = parseProfileListPagination(c.req.query());

    const lists = await ListsService.getUserLists(
      profile.id,
      publicOnly,
      parsed.data.tmdbId,
      parsed.data.itemType,
      limit,
      offset,
    );

    return c.json(lists, 200);
  }
}
