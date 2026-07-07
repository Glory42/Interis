import { normalizeLimit } from "../helpers/social-feed-metadata.helper";
import {
  buildActivityEngagementContext,
  buildFeedFallbackMediaContext,
  buildPostEngagementContext,
  buildReviewContext,
} from "../helpers/social-feed-context.helper";
import { dedupeReviewFeedItems } from "../helpers/social-feed-dedupe.helper";
import { toFeedItem } from "../helpers/social-feed-item.helper";
import { decodeFeedCursor, encodeFeedCursor } from "../helpers/social-feed-cursor.helper";
import { SocialRepository } from "../repositories/social.repository";
import type { ActivityRow, FeedItem } from "../types/social-feed.types";

export type FeedPage = {
  items: FeedItem[];
  nextCursor: string | null;
};

export class SocialFeedService {
  private static async buildFeedItems(
    rows: ActivityRow[],
    viewerId?: string,
  ): Promise<FeedItem[]> {
    const [reviewContext, postEngagementByPostId, activityEngagementById] = await Promise.all([
      buildReviewContext(rows, viewerId),
      buildPostEngagementContext(rows, viewerId),
      buildActivityEngagementContext(rows, viewerId),
    ]);

    // Depends on reviewContext (a row only needs a movie fallback lookup
    // when it has no review-attached movie already), so it can't join the
    // Promise.all above.
    const fallbackMedia = await buildFeedFallbackMediaContext(rows, reviewContext);

    const feedItems = rows.map((row) =>
      toFeedItem(row, reviewContext, postEngagementByPostId, activityEngagementById, fallbackMedia),
    );

    return dedupeReviewFeedItems(feedItems);
  }

  static async getFeed(userId: string, cursor?: string, limit?: number): Promise<FeedPage> {
    return SocialFeedService.getFollowingFeed(userId, limit, cursor);
  }

  static async getFollowingFeed(
    userId: string,
    limit?: number,
    cursor?: string,
  ): Promise<FeedPage> {
    const normalizedLimit = normalizeLimit(limit);
    const fetchLimit = normalizedLimit * 2;
    const decodedCursor = decodeFeedCursor(cursor);

    const followingRows = await SocialRepository.getFollowingIdsByFollowerId(userId);
    const feedUserIds = [...new Set([userId, ...followingRows.map((row) => row.followingId)])];

    const rows = await SocialRepository.getFeedActivityRows(
      feedUserIds,
      fetchLimit,
      decodedCursor,
    );
    const items = await SocialFeedService.buildFeedItems(rows, userId);

    // Raw rows (pre-dedupe) filling the fetch cap means there may be more
    // beyond this page; otherwise we've reached the end of the feed.
    const hasMore = rows.length === fetchLimit;
    const lastRow = rows.at(-1);
    const nextCursor =
      hasMore && lastRow
        ? encodeFeedCursor({ createdAt: lastRow.activity.createdAt, id: lastRow.activity.id })
        : null;

    return { items, nextCursor };
  }

  static async getUserActivityFeed(userId: string, limit?: number): Promise<FeedItem[]> {
    const normalizedLimit = normalizeLimit(limit);
    const fetchLimit = normalizedLimit * 2;

    const rows = await SocialRepository.getFeedActivityRows([userId], fetchLimit);
    const feedItems = await SocialFeedService.buildFeedItems(rows);

    return feedItems.slice(0, normalizedLimit);
  }
}
