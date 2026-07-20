import { createTtlCache } from "../../../infrastructure/cache/ttl-cache.helper";
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
import { ModerationRepository } from "../../moderation/repositories/moderation.repository";
import type { ActivityRow, FeedItem } from "../types/social-feed.types";

export type FeedPage = {
  items: FeedItem[];
  nextCursor: string | null;
};

// Short TTL - this only exists to absorb request bursts (e.g. React Query
// refetch-on-focus), not to serve meaningfully stale data.
const FEED_CACHE_TTL_MS = 20 * 1000;

const buildFeedItems = async (
  rows: ActivityRow[],
  viewerId?: string,
): Promise<FeedItem[]> => {
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
};

const getFollowingFeedUncached = async (
  userId: string,
  limit?: number,
  cursor?: string,
): Promise<FeedPage> => {
  const normalizedLimit = normalizeLimit(limit);
  const fetchLimit = normalizedLimit * 2;
  const decodedCursor = decodeFeedCursor(cursor);

  const [followingRows, blockedIds, blockedByIds, mutedIds] = await Promise.all([
    SocialRepository.getFollowingIdsByFollowerId(userId),
    ModerationRepository.getBlockedIds(userId),
    ModerationRepository.getBlockedByIds(userId),
    ModerationRepository.getMutedIds(userId),
  ]);
  // Blocks are mutual (either direction hides the other's activity); mutes
  // are one-directional — being muted by someone else must not hide your
  // own activity from your own feed.
  const excludedIds = new Set([...blockedIds, ...blockedByIds, ...mutedIds]);
  const feedUserIds = [
    userId,
    ...new Set(
      followingRows
        .map((row) => row.followingId)
        .filter((followingId) => !excludedIds.has(followingId)),
    ),
  ];

  const rows = await SocialRepository.getFeedActivityRows(feedUserIds, fetchLimit, decodedCursor);
  const items = await buildFeedItems(rows, userId);

  // Raw rows (pre-dedupe) filling the fetch cap means there may be more
  // beyond this page; otherwise we've reached the end of the feed.
  const hasMore = rows.length === fetchLimit;
  const lastRow = rows.at(-1);
  const nextCursor =
    hasMore && lastRow
      ? encodeFeedCursor({ createdAt: lastRow.activity.createdAt, id: lastRow.activity.id })
      : null;

  return { items, nextCursor };
};

const cachedGetFollowingFeed = createTtlCache(getFollowingFeedUncached, {
  ttlMs: FEED_CACHE_TTL_MS,
  keyFn: (userId: string, limit?: number, cursor?: string) =>
    `${userId}:${limit ?? ""}:${cursor ?? ""}`,
});

const getUserActivityFeedUncached = async (
  userId: string,
  limit?: number,
): Promise<FeedItem[]> => {
  const normalizedLimit = normalizeLimit(limit);
  const fetchLimit = normalizedLimit * 2;

  const rows = await SocialRepository.getFeedActivityRows([userId], fetchLimit);
  const feedItems = await buildFeedItems(rows);

  return feedItems.slice(0, normalizedLimit);
};

const cachedGetUserActivityFeed = createTtlCache(getUserActivityFeedUncached, {
  ttlMs: FEED_CACHE_TTL_MS,
  keyFn: (userId: string, limit?: number) => `${userId}:${limit ?? ""}`,
});

export class SocialFeedService {
  static async getFeed(userId: string, cursor?: string, limit?: number): Promise<FeedPage> {
    return SocialFeedService.getFollowingFeed(userId, limit, cursor);
  }

  static async getFollowingFeed(
    userId: string,
    limit?: number,
    cursor?: string,
  ): Promise<FeedPage> {
    return cachedGetFollowingFeed(userId, limit, cursor);
  }

  static async getUserActivityFeed(userId: string, limit?: number): Promise<FeedItem[]> {
    return cachedGetUserActivityFeed(userId, limit);
  }

  // Without this, a fresh follow can take up to FEED_CACHE_TTL_MS to show
  // the followed user's activity - the TTL cache has no way to know
  // follow/unfollow changed who belongs in the feed.
  static invalidateFollowingFeed(userId: string): void {
    cachedGetFollowingFeed.invalidatePrefix(`${userId}:`);
  }
}
