import { createTtlCache } from "../../../infrastructure/cache/ttl-cache.helper";
import { normalizeLimit } from "../helpers/social-feed-metadata.helper";
import {
  buildActivityEngagementContext,
  buildFeedFallbackMediaContext,
  buildPostEngagementContext,
  buildReviewContext,
} from "../helpers/social-feed-context.helper";
import { dedupeReviewFeedItems } from "../helpers/social-feed-dedupe.helper";
import { inferFeedItemMediaType } from "../helpers/social-feed-channel.helper";
import { toFeedItem } from "../helpers/social-feed-item.helper";
import { decodeFeedCursor, encodeFeedCursor } from "../helpers/social-feed-cursor.helper";
import { SocialRepository } from "../repositories/social.repository";
import { ModerationRepository } from "../../moderation/repositories/moderation.repository";
import type { ActivityRow, FeedItem, FeedMediaType } from "../types/social-feed.types";

// Safety cap on how many raw activity rows a single filtered request will
// scan looking for matches (e.g. a viewer whose followed users have logged
// almost no movies at all, with the "movie" filter active) - bounds one
// request's latency instead of scanning the whole feed history.
const MEDIA_FILTER_SCAN_ROW_CAP = 300;

export type FeedPage = {
  items: FeedItem[];
  nextCursor: string | null;
};

// Feed rows/engagement counts change quickly, so the TTL stays short — this
// only exists to absorb request bursts (e.g. React Query refetch-on-focus,
// or two viewers with overlapping follow sets hitting the same page),
// not to serve meaningfully stale data.
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

const getFeedUserIds = async (userId: string): Promise<string[]> => {
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

  return [
    userId,
    ...new Set(
      followingRows
        .map((row) => row.followingId)
        .filter((followingId) => !excludedIds.has(followingId)),
    ),
  ];
};

const getFollowingFeedUncached = async (
  userId: string,
  limit?: number,
  cursor?: string,
  mediaType?: FeedMediaType,
): Promise<FeedPage> => {
  const normalizedLimit = normalizeLimit(limit);
  const fetchLimit = normalizedLimit * 2;
  const feedUserIds = await getFeedUserIds(userId);

  if (!mediaType) {
    const decodedCursor = decodeFeedCursor(cursor);
    const rows = await SocialRepository.getFeedActivityRows(feedUserIds, fetchLimit, decodedCursor);
    const dedupedItems = await buildFeedItems(rows, userId);

    // dedupedItems can be shorter than rows (dedupeReviewFeedItems only
    // ever *drops* items, it never merges two rows into one - each
    // surviving item's id/createdAt is still a genuine row's identity,
    // see toFeedItem), so it can also be longer than normalizedLimit
    // since fetchLimit over-fetches 2x as headroom for that dedup step.
    // Slicing here (rather than returning dedupedItems as-is) is the fix:
    // the page must never return more than what was asked for.
    const items = dedupedItems.slice(0, normalizedLimit);
    const lastReturnedItem = items.at(-1);
    const lastFetchedRow = rows.at(-1);

    let nextCursor: string | null = null;
    if (dedupedItems.length > normalizedLimit && lastReturnedItem) {
      // More already-built items exist beyond this page - resume right
      // after the last one actually returned.
      nextCursor = encodeFeedCursor({
        createdAt: lastReturnedItem.createdAt,
        id: lastReturnedItem.id,
      });
    } else if (rows.length === fetchLimit && lastFetchedRow) {
      // Dedup left us with a page at or under the limit, but the fetch
      // cap was hit - there may be more beyond what was fetched, even if
      // nothing new survived dedup this time. Resume from the last
      // *fetched* row (not the last item, which may not exist) so the
      // next page keeps scanning forward instead of re-fetching the same
      // window - same "advance by rows scanned" principle as the
      // mediaType-filtered branch below.
      nextCursor = encodeFeedCursor({
        createdAt: lastFetchedRow.activity.createdAt,
        id: lastFetchedRow.activity.id,
      });
    }

    return { items, nextCursor };
  }

  // Media-type filter: the raw activities table is polymorphic (reviews,
  // posts, follows, likes, ...) with no single column to filter on directly,
  // so instead of one query we scan successive batches, resolve each into a
  // full FeedItem (same pipeline as the unfiltered path), and keep only the
  // ones matching the requested channel - advancing the cursor by rows
  // *scanned*, not rows *matched*, so a later page resumes from the right
  // place instead of re-scanning what was already filtered out.
  let decodedCursor = decodeFeedCursor(cursor);
  const collected: FeedItem[] = [];
  let scannedRows = 0;
  let nextCursor: string | null = null;

  while (collected.length < normalizedLimit && scannedRows < MEDIA_FILTER_SCAN_ROW_CAP) {
    const rows = await SocialRepository.getFeedActivityRows(feedUserIds, fetchLimit, decodedCursor);
    if (rows.length === 0) {
      nextCursor = null;
      break;
    }

    scannedRows += rows.length;
    const items = await buildFeedItems(rows, userId);
    collected.push(...items.filter((item) => inferFeedItemMediaType(item) === mediaType));

    const lastRow = rows.at(-1);
    decodedCursor = lastRow
      ? { createdAt: lastRow.activity.createdAt, id: lastRow.activity.id }
      : decodedCursor;

    if (rows.length < fetchLimit) {
      // Reached the true end of the underlying feed.
      nextCursor = null;
      break;
    }

    nextCursor = lastRow
      ? encodeFeedCursor({ createdAt: lastRow.activity.createdAt, id: lastRow.activity.id })
      : null;
  }

  return { items: collected, nextCursor };
};

const cachedGetFollowingFeed = createTtlCache(getFollowingFeedUncached, {
  ttlMs: FEED_CACHE_TTL_MS,
  keyFn: (userId: string, limit?: number, cursor?: string, mediaType?: FeedMediaType) =>
    `${userId}:${limit ?? ""}:${cursor ?? ""}:${mediaType ?? ""}`,
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
    mediaType?: FeedMediaType,
  ): Promise<FeedPage> {
    return cachedGetFollowingFeed(userId, limit, cursor, mediaType);
  }

  static async getUserActivityFeed(userId: string, limit?: number): Promise<FeedItem[]> {
    return cachedGetUserActivityFeed(userId, limit);
  }

  // Follow/unfollow changes who belongs in a user's following feed, which
  // the TTL cache above has no way to know about on its own - without this,
  // a fresh follow can take up to FEED_CACHE_TTL_MS to show the followed
  // user's activity, which contradicts this cache's whole "absorb bursts,
  // not serve meaningfully stale data" premise.
  static invalidateFollowingFeed(userId: string): void {
    cachedGetFollowingFeed.invalidatePrefix(`${userId}:`);
  }
}
