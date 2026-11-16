import { createTtlCache } from "../../../infrastructure/cache/ttl-cache.helper";
import { env } from "../../../infrastructure/config/env";
import { UsersStatsRepository } from "../repositories/users-stats.repository";

type StatsCounts = Awaited<ReturnType<typeof UsersStatsRepository.getStatsCounts>>;
type DetailedStats = Awaited<ReturnType<typeof UsersStatsRepository.getDetailedStats>>;

const keyOf = (userId: string) => `${userId}:`;

// Profile counts and detailed stats are the same for every viewer and cost 7 queries each.
// The owner always reads fresh (only their writes change them, except follower counts,
// which follow/unfollow/block drop explicitly via forget).
export const createUsersStatsCache = (ttl: { countsMs: number; detailedMs: number; networkMs: number }) => {
  const counts = createTtlCache((userId: string) => UsersStatsRepository.getStatsCounts(userId), {
    keyFn: keyOf,
    ttlMs: ttl.countsMs,
    maxEntries: 1_000,
  });
  const detailed = createTtlCache((userId: string) => UsersStatsRepository.getDetailedStats(userId), {
    keyFn: keyOf,
    ttlMs: ttl.detailedMs,
    maxEntries: 500,
  });
  const network = createTtlCache(() => UsersStatsRepository.getNetworkStats(), {
    keyFn: () => "network",
    ttlMs: ttl.networkMs,
    maxEntries: 1,
  });

  const forget = (userId: string): void => {
    counts.invalidatePrefix(keyOf(userId));
    detailed.invalidatePrefix(keyOf(userId));
  };

  return {
    forget,
    statsCounts: (userId: string, viewerIsOwner: boolean): Promise<StatsCounts> => {
      if (viewerIsOwner) forget(userId);
      return counts(userId);
    },
    detailedStats: (userId: string, viewerIsOwner: boolean): Promise<DetailedStats> => {
      if (viewerIsOwner) forget(userId);
      return detailed(userId);
    },
    networkStats: () => network(),
  };
};

// Off under test so integration suites see their own writes immediately.
const isTest = env.NODE_ENV === "test";
const usersStatsCache = createUsersStatsCache({
  countsMs: isTest ? 0 : 60_000,
  detailedMs: isTest ? 0 : 5 * 60_000,
  networkMs: isTest ? 0 : 10 * 60_000,
});

export class UsersStatsCacheService {
  static statsCounts(userId: string, viewerUserId: string | null) {
    return usersStatsCache.statsCounts(userId, viewerUserId === userId);
  }

  static detailedStats(userId: string, viewerUserId: string | null) {
    return usersStatsCache.detailedStats(userId, viewerUserId === userId);
  }

  static networkStats() {
    return usersStatsCache.networkStats();
  }

  // A follow edge changed: both sides' follower/following counts moved.
  static forgetFollowEdge(followerId: string, followingId: string): void {
    usersStatsCache.forget(followerId);
    usersStatsCache.forget(followingId);
  }
}
