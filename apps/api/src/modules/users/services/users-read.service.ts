import { dedupeRecentPosters } from "../helpers/users-summary.helper";
import { UsersMediaInteractionsRepository } from "../repositories/users-media-interactions.repository";
import { UsersProfileRepository } from "../repositories/users-profile.repository";
import { UsersReviewsListRepository, UsersReviewsRepository } from "../repositories/users-reviews.repository";
import { UsersStatsRepository } from "../repositories/users-stats.repository";
import { UsersProfileService } from "./users-profile.service";

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

  static async getWatchedFilms(userId: string, limit?: number, offset?: number) {
    return UsersMediaInteractionsRepository.getWatchedFilms(userId, limit, offset);
  }

  static async getLikedFilms(userId: string, limit?: number, offset?: number) {
    return UsersMediaInteractionsRepository.getLikedFilms(userId, limit, offset);
  }

  static async getWatchlistedFilms(userId: string, limit?: number, offset?: number) {
    return UsersMediaInteractionsRepository.getWatchlistedFilms(userId, limit, offset);
  }

  static async getStats(userId: string) {
    return UsersStatsRepository.getStatsCounts(userId);
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
      image: profile.image,
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
