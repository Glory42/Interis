import { dedupeRecentPosters } from "../helpers/users-summary.helper";
import type { ProfileShelfSort, ProfileShelfType } from "../dto/users.dto";
import {
  UsersMediaInteractionsRepository,
  type MediaInteractionFlag,
} from "../repositories/users-media-interactions.repository";
import { UsersProfileRepository } from "../repositories/users-profile.repository";
import { UsersReviewsListRepository, UsersReviewsRepository } from "../repositories/users-reviews.repository";
import { UsersStatsRepository } from "../repositories/users-stats.repository";
import { UsersProfileService } from "./users-profile.service";

const NEWEST_SHELF_QUERY = { type: "all", sort: "recent", offset: 0 } as const;

export class UsersReadService {
  static async getTotalUsersCount() {
    return UsersStatsRepository.getTotalUsersCount();
  }

  static async getNetworkStats() {
    return UsersStatsRepository.getNetworkStats();
  }

  static async searchUsers(query: string, limit = 8) {
    return UsersProfileRepository.searchProfilesByUsername(query, limit);
  }

  static async getReviewsWithMovies(userId: string, limit?: number, offset?: number) {
    return UsersReviewsListRepository.getReviewsWithMovies(userId, limit, offset);
  }

  static async getReviewDetailByUsername(
    username: string,
    reviewId: string,
    viewerUserId?: string | null,
  ) {
    return UsersReviewsRepository.getReviewDetailByUsername(username, reviewId, viewerUserId);
  }

  static async getWatchedMovies(userId: string, limit?: number, offset?: number) {
    return UsersMediaInteractionsRepository.getWatchedMovies(userId, limit, offset);
  }

  static async getLikedMovies(userId: string, limit: number) {
    return UsersMediaInteractionsRepository.getMediaByFlag(userId, "liked", {
      ...NEWEST_SHELF_QUERY,
      limit,
    });
  }

  static async getWatchlistedMovies(userId: string, limit: number) {
    return UsersMediaInteractionsRepository.getMediaByFlag(userId, "watchlisted", {
      ...NEWEST_SHELF_QUERY,
      limit,
    });
  }

  static async getMediaShelf(
    userId: string,
    flag: MediaInteractionFlag,
    query: { type: ProfileShelfType; sort: ProfileShelfSort; limit: number; offset: number },
  ) {
    const [items, counts] = await Promise.all([
      UsersMediaInteractionsRepository.getMediaByFlag(userId, flag, query),
      UsersMediaInteractionsRepository.countMediaByFlag(userId, flag),
    ]);
    const total = query.type === "all" ? counts.movie + counts.tv : counts[query.type];

    return { items, total, counts };
  }

  static async getStats(userId: string) {
    return UsersStatsRepository.getStatsCounts(userId);
  }

  static async getDetailedStats(userId: string) {
    const { minutesWatched, ...stats } = await UsersStatsRepository.getDetailedStats(userId);
    const ratedLogCount = stats.ratingDistribution.reduce((sum, row) => sum + row.count, 0);
    const ratingTotal = stats.ratingDistribution.reduce(
      (sum, row) => sum + row.rating * row.count,
      0,
    );

    return {
      ...stats,
      averageRating: ratedLogCount > 0 ? Math.round((ratingTotal / ratedLogCount) * 100) / 100 : null,
      ratedLogCount,
      hoursWatched: Math.round((minutesWatched / 60) * 10) / 10,
    };
  }

  static async getMeSummary(userId: string) {
    const [profile, summaryData] = await Promise.all([
      UsersProfileService.findById(userId),
      UsersStatsRepository.getMeSummaryData(userId),
    ]);
    if (!profile) {
      return null;
    }

    const recentPosters = dedupeRecentPosters(summaryData.recentRows, 5);

    return {
      id: profile.id,
      username: profile.username,
      displayUsername: profile.displayUsername,
      avatarUrl: profile.avatarUrl,
      counts: {
        logs: summaryData.logs,
        followers: summaryData.followers,
        following: summaryData.following,
      },
      recentPosters,
    };
  }
}
