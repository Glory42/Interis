import { AdminOverviewRepository } from "./repositories/admin-overview.repository";

const DAY_MS = 86_400_000;

export class AdminOverviewService {
  // Computed on request only (page open or Refresh); never on a timer, never stored.
  static async getOverview(now: Date = new Date()) {
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
    const weekAhead = new Date(now.getTime() + 7 * DAY_MS);

    const [pending, suspensionsEndingSoon, since, [films, series], latestActions] = await Promise.all([
      AdminOverviewRepository.pendingReports(),
      AdminOverviewRepository.suspensionsEndingBy(weekAhead),
      AdminOverviewRepository.countsSince(weekAgo),
      AdminOverviewRepository.cachedMedia(),
      AdminOverviewRepository.latestActions(5),
    ]);
    const [newAccounts, movieLogs, serialLogs, reviews, posts, reviewComments, postComments] = since;

    return {
      computedAt: now,
      needsYou: {
        pendingReports: pending.count,
        oldestPendingAt: pending.oldest,
        reportedItems: pending.items,
        suspensionsEndingSoon,
      },
      lastSevenDays: {
        newAccounts,
        diaryEntries: movieLogs + serialLogs,
        reviews,
        posts,
        comments: reviewComments + postComments,
      },
      cache: { films, series },
      latestActions,
    };
  }
}
