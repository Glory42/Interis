import type { Context } from "hono";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import { SocialService } from "./social.service";
import { UsersService } from "../users/users.service";
import { normalizeSocialFeedLimit } from "./helpers/social-query-normalizer.helper";
import { sendBadRequest, sendNotFound } from "../../commons/http/validation-response.hono";

export class SocialController {
  static async getFeed(c: Context<AppEnv>): Promise<Response> {
    const limit = normalizeSocialFeedLimit(c.req.query("limit"), 20);
    const feed = await SocialService.getFeed(c.get("user").id, c.req.query("cursor"), limit);
    return c.json(feed, 200);
  }

  static async getFollowingFeed(c: Context<AppEnv>): Promise<Response> {
    const limit = normalizeSocialFeedLimit(c.req.query("limit"), 20);
    const feed = await SocialService.getFollowingFeed(
      c.get("user").id,
      limit,
      c.req.query("cursor"),
    );
    return c.json(feed, 200);
  }

  static async follow(c: Context<AppEnv>): Promise<Response> {
    const target = await UsersService.findByUsername(c.req.param("username") as string);
    if (!target) {
      return sendNotFound(c, "User not found");
    }

    const result = await SocialService.follow(c.get("user").id, target.id, target.username);
    if ("error" in result) {
      return sendBadRequest(c, result.error);
    }
    return c.json(result, 200);
  }

  static async unfollow(c: Context<AppEnv>): Promise<Response> {
    const target = await UsersService.findByUsername(c.req.param("username") as string);
    if (!target) {
      return sendNotFound(c, "User not found");
    }

    await SocialService.unfollow(c.get("user").id, target.id);
    return c.json({ success: true }, 200);
  }

  static async checkIsFollowing(c: Context<AppEnv>): Promise<Response> {
    const target = await UsersService.findByUsername(c.req.param("username") as string);
    if (!target) {
      return sendNotFound(c, "User not found");
    }

    const isFollowing = await SocialService.isFollowing(c.get("user").id, target.id);
    return c.json({ isFollowing }, 200);
  }

  static async getFollowers(c: Context): Promise<Response> {
    const target = await UsersService.findByUsername(c.req.param("username") as string);
    if (!target) {
      return sendNotFound(c, "User not found");
    }

    const followers = await SocialService.getFollowers(target.id);
    return c.json(followers, 200);
  }

  static async getFollowing(c: Context): Promise<Response> {
    const target = await UsersService.findByUsername(c.req.param("username") as string);
    if (!target) {
      return sendNotFound(c, "User not found");
    }

    const following = await SocialService.getFollowing(target.id);
    return c.json(following, 200);
  }

  static async removeFollower(c: Context<AppEnv>): Promise<Response> {
    const follower = await UsersService.findByUsername(c.req.param("username") as string);
    if (!follower) {
      return sendNotFound(c, "User not found");
    }

    await SocialService.removeFollower(c.get("user").id, follower.id);
    return c.json({ success: true }, 200);
  }

  static async likeActivity(c: Context<AppEnv>): Promise<Response> {
    const result = await SocialService.likeActivity(
      c.get("user").id,
      c.req.param("activityId") as string,
    );
    if ("error" in result) {
      return sendNotFound(c, result.error);
    }
    return c.json(result, 200);
  }

  static async unlikeActivity(c: Context<AppEnv>): Promise<Response> {
    await SocialService.unlikeActivity(c.get("user").id, c.req.param("activityId") as string);
    return c.json({ success: true }, 200);
  }
}
