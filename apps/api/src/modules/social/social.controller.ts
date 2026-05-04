import type { Request, Response } from "express";
import { SocialService } from "./social.service";
import { UsersService } from "../users/users.service";
import { normalizeSocialFeedLimit } from "./helpers/social-query-normalizer.helper";
import type { FeedQueryDto, UsernameParamsDto } from "./dto/social.dto";

export class SocialController {
  static async getFeed(
    req: Request<{}, {}, {}, FeedQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizeSocialFeedLimit(req.query.limit, 20);
    const feed = await SocialService.getFeed(req.user.id, undefined, limit);
    res.status(200).json(feed);
  }

  static async getFollowingFeed(
    req: Request<{}, {}, {}, FeedQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizeSocialFeedLimit(req.query.limit, 20);
    const feed = await SocialService.getFollowingFeed(req.user.id, limit);
    res.status(200).json(feed);
  }

  static async follow(
    req: Request<UsernameParamsDto>,
    res: Response,
  ): Promise<void> {
    const target = await UsersService.findByUsername(req.params.username);
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const result = await SocialService.follow(
      req.user.id,
      target.id,
      target.username,
    );
    if ("error" in result) {
      res.status(400).json({ error: result.error });
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
      res.status(404).json({ error: "User not found" });
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
      res.status(404).json({ error: "User not found" });
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
      res.status(404).json({ error: "User not found" });
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
      res.status(404).json({ error: "User not found" });
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
      res.status(404).json({ error: "User not found" });
      return;
    }

    await SocialService.removeFollower(req.user.id, follower.id);
    res.status(200).json({ success: true });
  }
}
