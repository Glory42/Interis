import { createTtlCache } from "../../../infrastructure/cache/ttl-cache.helper";
import { normalizeBoundedLimit } from "../../../commons/helpers/pagination.helper";
import { DEFAULT_FEED_PAGE_SIZE, MAX_FEED_PAGE_SIZE } from "../constants/social-feed.constants";
import { toFeedItems } from "../helpers/feed-kinds/feed-kind.registry";
import { dedupeReviewFeedItems } from "../helpers/social-feed-dedupe.helper";
import { SocialRepository } from "../repositories/social.repository";
import { ModerationRepository } from "../../moderation/repositories/moderation.repository";
import {
  GroupedFeedService,
  type GroupedFeedPage,
  type GroupedFeedPageOptions,
  type GroupedFeedSource,
} from "./grouped-feed.service";
import type { ActivityRow, FeedItem, FeedRow } from "../types/social-feed.types";

// Feed rows/engagement counts change quickly, so the TTL stays short — this
// only exists to absorb request bursts (e.g. React Query refetch-on-focus,
// or two viewers with overlapping follow sets hitting the same page),
// not to serve meaningfully stale data.
const FEED_CACHE_TTL_MS = 20 * 1000;

const buildFeedItems = async (
  rows: ActivityRow[],
  viewerId?: string,
): Promise<FeedItem[]> => dedupeReviewFeedItems(await toFeedItems(rows, viewerId));

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

// The viewer's own activity plus everyone they follow, minus blocks and mutes.
const followingFeedSource = async (viewerId: string): Promise<GroupedFeedSource> => {
  const feedUserIds = await getFeedUserIds(viewerId);
  return {
    paged: true,
    readRows: (limit, cursor) => SocialRepository.getFeedActivityRows(feedUserIds, limit, cursor),
    toItems: (rows) => buildFeedItems(rows, viewerId),
  };
};

const actorFeedSource = (actorId: string): GroupedFeedSource => ({
  paged: false,
  readRows: (limit) => SocialRepository.getFeedActivityRows([actorId], limit),
  toItems: (rows) => buildFeedItems(rows),
});

const cachedGetGroupedFollowingFeed = createTtlCache(
  async (viewerId: string, options: GroupedFeedPageOptions) =>
    GroupedFeedService.readPage(await followingFeedSource(viewerId), options),
  {
    ttlMs: FEED_CACHE_TTL_MS,
    keyFn: (viewerId, { limit, cursor, mediaType, timeZone }) =>
      `${viewerId}:${limit ?? ""}:${cursor ?? ""}:${mediaType ?? ""}:${timeZone}`,
  },
);

const cachedGetActorGroupedFeed = createTtlCache(
  async (actorId: string, limit: number, timeZone: string) =>
    (await GroupedFeedService.readPage(actorFeedSource(actorId), { limit, timeZone })).rows,
  {
    ttlMs: FEED_CACHE_TTL_MS,
    keyFn: (actorId, limit, timeZone) => `${actorId}:${limit}:${timeZone}`,
  },
);

const getUserActivityFeedUncached = async (
  userId: string,
  limit?: number,
): Promise<FeedItem[]> => {
  const normalizedLimit = normalizeBoundedLimit(limit, { default: DEFAULT_FEED_PAGE_SIZE, max: MAX_FEED_PAGE_SIZE });
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
  static async getGroupedFollowingFeed(
    viewerId: string,
    options: GroupedFeedPageOptions,
  ): Promise<GroupedFeedPage> {
    return cachedGetGroupedFollowingFeed(viewerId, options);
  }

  // The profile overview: one actor's newest `limit` rows, no cursor.
  static async getActorGroupedFeed(actorId: string, limit: number, timeZone: string): Promise<FeedRow[]> {
    return cachedGetActorGroupedFeed(actorId, limit, timeZone);
  }

  // The public widget's flat activity list.
  static async getUserActivityFeed(userId: string, limit?: number): Promise<FeedItem[]> {
    return cachedGetUserActivityFeed(userId, limit);
  }

  // Follow/unfollow changes who belongs in a user's following feed, which
  // the TTL cache above has no way to know about on its own - without this,
  // a fresh follow can take up to FEED_CACHE_TTL_MS to show the followed
  // user's activity, which contradicts this cache's whole "absorb bursts,
  // not serve meaningfully stale data" premise.
  static invalidateFollowingFeed(userId: string): void {
    cachedGetGroupedFollowingFeed.invalidatePrefix(`${userId}:`);
  }

  // The public profile's activity lists, cached per actor.
  static invalidateUserActivityFeed(userId: string): void {
    cachedGetUserActivityFeed.invalidatePrefix(`${userId}:`);
    cachedGetActorGroupedFeed.invalidatePrefix(`${userId}:`);
  }
}
