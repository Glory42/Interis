import type { Request, Response } from "express";
import { SocialService } from "./social.service";
import { UsersService } from "../users/users.service";
import { resolveTimeZone } from "./helpers/feed-day.helper";
import { DEFAULT_FEED_PAGE_SIZE } from "./constants/social-feed.constants";
import { parseIntParam } from "../../commons/helpers/parse-int-param.helper";
import {
  FollowingStatusQuerySchema,
  type FeedQueryDto,
  type UsernameParamsDto,
} from "./dto/social.dto";
import {
  resolveOrNotFound,
  sendBadRequest,
  sendNotFound,
  sendValidationError,
} from "../../commons/http/validation-response.helper";

export class SocialController {
  // GET /api/social/feed/grouped?limit=15&cursor=…&mediaType=movie&tz=Europe/Istanbul
  static async getGroupedFollowingFeed(
    req: Request<{}, {}, {}, FeedQueryDto>,
    res: Response,
  ): Promise<void> {
    const { limit, cursor, mediaType, tz } = req.query;
    const feed = await SocialService.getGroupedFollowingFeed(req.user.id, {
      limit: parseIntParam(limit, DEFAULT_FEED_PAGE_SIZE),
      cursor,
      mediaType: mediaType === "movie" || mediaType === "tv" ? mediaType : undefined,
      timeZone: resolveTimeZone(tz),
    });
    res.status(200).json(feed);
  }

  static async follow(
    req: Request<UsernameParamsDto>,
    res: Response,
  ): Promise<void> {
    const target = await resolveOrNotFound(res, "User not found", () =>
      UsersService.findByUsername(req.params.username),
    );
    if (!target) {
      return;
    }

    const result = await SocialService.follow(
      req.user.id,
      target.id,
      target.username,
    );
    if ("error" in result) {
      sendBadRequest(res, result.error);
      return;
    }
    res.status(200).json(result);
  }

  static async unfollow(
    req: Request<UsernameParamsDto>,
    res: Response,
  ): Promise<void> {
    const target = await resolveOrNotFound(res, "User not found", () =>
      UsersService.findByUsername(req.params.username),
    );
    if (!target) {
      return;
    }

    await SocialService.unfollow(req.user.id, target.id);
    res.status(200).json({ success: true });
  }

  static async checkIsFollowing(
    req: Request<UsernameParamsDto>,
    res: Response,
  ): Promise<void> {
    const target = await resolveOrNotFound(res, "User not found", () =>
      UsersService.findByUsername(req.params.username),
    );
    if (!target) {
      return;
    }

    const isFollowing = await SocialService.isFollowing(req.user.id, target.id);
    res.status(200).json({ isFollowing });
  }

  // GET /api/social/following-status?userIds=a,b,c → which of them the viewer follows.
  static async getFollowingStatus(req: Request, res: Response): Promise<void> {
    const parsed = FollowingStatusQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const followingIds = await SocialService.getFollowedAmong(req.user.id, parsed.data.userIds);
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ followingIds });
  }

  static async getFollowers(
    req: Request<UsernameParamsDto>,
    res: Response,
  ): Promise<void> {
    const target = await resolveOrNotFound(res, "User not found", () =>
      UsersService.findByUsername(req.params.username),
    );
    if (!target) {
      return;
    }

    const followers = await SocialService.getFollowers(target.id);
    res.status(200).json(followers);
  }

  static async getFollowing(
    req: Request<UsernameParamsDto>,
    res: Response,
  ): Promise<void> {
    const target = await resolveOrNotFound(res, "User not found", () =>
      UsersService.findByUsername(req.params.username),
    );
    if (!target) {
      return;
    }

    const following = await SocialService.getFollowing(target.id);
    res.status(200).json(following);
  }

  static async removeFollower(
    req: Request<UsernameParamsDto>,
    res: Response,
  ): Promise<void> {
    const follower = await resolveOrNotFound(res, "User not found", () =>
      UsersService.findByUsername(req.params.username),
    );
    if (!follower) {
      return;
    }

    await SocialService.removeFollower(req.user.id, follower.id);
    res.status(200).json({ success: true });
  }

  static async likeActivity(
    req: Request<{ activityId: string }>,
    res: Response,
  ): Promise<void> {
    const result = await SocialService.likeActivity(req.user.id, req.params.activityId);
    if ("error" in result) {
      sendNotFound(res, result.error);
      return;
    }
    res.status(200).json(result);
  }

  static async unlikeActivity(
    req: Request<{ activityId: string }>,
    res: Response,
  ): Promise<void> {
    await SocialService.unlikeActivity(req.user.id, req.params.activityId);
    res.status(200).json({ success: true });
  }
}
