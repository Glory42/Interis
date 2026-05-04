import { normalizeLimit } from "../helpers/social-feed-metadata.helper";
import {
  buildPostEngagementContext,
  buildReviewContext,
} from "../helpers/social-feed-context.helper";
import { dedupeReviewFeedItems } from "../helpers/social-feed-dedupe.helper";
import { toFeedItem } from "../helpers/social-feed-item.helper";
import { SocialRepository } from "../repositories/social.repository";
import type { ActivityRow, FeedItem } from "../types/social-feed.types";

export class SocialFeedService {
  private static async buildFeedItems(
    rows: ActivityRow[],
    viewerId?: string,
  ): Promise<FeedItem[]> {
    const [reviewContext, postEngagementByPostId] = await Promise.all([
      buildReviewContext(rows, viewerId),
      buildPostEngagementContext(rows, viewerId),
    ]);

    const feedItems = await Promise.all(
      rows.map((row) => toFeedItem(row, reviewContext, postEngagementByPostId)),
    );

    return dedupeReviewFeedItems(feedItems);
  }

  static async getFeed(userId: string, _cursor?: string, limit?: number) {
    return SocialFeedService.getFollowingFeed(userId, limit);
  }

  static async getFollowingFeed(userId: string, limit?: number): Promise<FeedItem[]> {
    const normalizedLimit = normalizeLimit(limit);
    const fetchLimit = normalizedLimit * 2;

    const followingRows = await SocialRepository.getFollowingIdsByFollowerId(userId);
    const feedUserIds = [...new Set([userId, ...followingRows.map((row) => row.followingId)])];

    const rows = await SocialRepository.getFeedActivityRows(feedUserIds, fetchLimit);
    const feedItems = await SocialFeedService.buildFeedItems(rows, userId);

    return feedItems.slice(0, normalizedLimit);
  }

  static async getUserActivityFeed(userId: string, limit?: number): Promise<FeedItem[]> {
    const normalizedLimit = normalizeLimit(limit);
    const fetchLimit = normalizedLimit * 2;

    const rows = await SocialRepository.getFeedActivityRows([userId], fetchLimit);
    const feedItems = await SocialFeedService.buildFeedItems(rows);

    return feedItems.slice(0, normalizedLimit);
  }
}
