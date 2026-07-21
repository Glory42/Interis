import type { Request, Response } from "express";
import { SocialService } from "./social.service";
import { UsersService } from "../users/users.service";
import {
  normalizeSocialFeedLimit,
  normalizeSocialFeedMediaType,
} from "./helpers/social-query-normalizer.helper";
import type { FeedQueryDto, UsernameParamsDto } from "./dto/social.dto";
import { sendBadRequest, sendNotFound } from "../../commons/http/validation-response.helper";

export class SocialController {
  static async getFeed(
    req: Request<{}, {}, {}, FeedQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizeSocialFeedLimit(req.query.limit, 20);
    const feed = await SocialService.getFeed(req.user.id, req.query.cursor, limit);
    res.status(200).json(feed);
  }

  static async getFollowingFeed(
    req: Request<{}, {}, {}, FeedQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizeSocialFeedLimit(req.query.limit, 20);
    const mediaType = normalizeSocialFeedMediaType(req.query.mediaType);
    const feed = await SocialService.getFollowingFeed(
      req.user.id,
      limit,
      req.query.cursor,
      mediaType,
    );
    res.status(200).json(feed);
  }

  static async follow(
    req: Request<UsernameParamsDto>,
    res: Response,
  ): Promise<void> {
    const target = await UsersService.findByUsername(req.params.username);
    if (!target) {
      sendNotFound(res, "User not found");
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
    const target = await UsersService.findByUsername(req.params.username);
    if (!target) {
      sendNotFound(res, "User not found");
      return;
    }

    await SocialService.unfollow(req.user.id, target.id);
    res.status(200).json({ success: true });
  }

  static async checkIsFollowing(
    req: Request<UsernameParamsDto>,
    res: Response,
  ): Promise<void> {
    const target = await UsersService.findByUsername(req.params.username);
    if (!target) {
      sendNotFound(res, "User not found");
      return;
    }

    const isFollowing = await SocialService.isFollowing(req.user.id, target.id);
    res.status(200).json({ isFollowing });
  }

  static async getFollowers(
    req: Request<UsernameParamsDto>,
    res: Response,
  ): Promise<void> {
    const target = await UsersService.findByUsername(req.params.username);
    if (!target) {
      sendNotFound(res, "User not found");
      return;
    }

    const followers = await SocialService.getFollowers(target.id);
    res.status(200).json(followers);
  }

  static async getFollowing(
    req: Request<UsernameParamsDto>,
    res: Response,
  ): Promise<void> {
    const target = await UsersService.findByUsername(req.params.username);
    if (!target) {
      sendNotFound(res, "User not found");
      return;
    }

    const following = await SocialService.getFollowing(target.id);
    res.status(200).json(following);
  }

  static async removeFollower(
    req: Request<UsernameParamsDto>,
    res: Response,
  ): Promise<void> {
    const follower = await UsersService.findByUsername(req.params.username);
    if (!follower) {
      sendNotFound(res, "User not found");
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
