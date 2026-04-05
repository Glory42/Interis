import { dedupeRecentPosters } from "../helpers/users-summary.helper";
import { UsersRepository } from "../repositories/users.repository";
import { UsersProfileService } from "./users-profile.service";

export class UsersReadService {
  static async getTotalUsersCount() {
    return UsersRepository.getTotalUsersCount();
  }

  static async searchUsers(query: string, limit = 8) {
    return UsersRepository.searchProfilesByUsername(query, limit);
  }

  static async getDiaryWithMovies(userId: string) {
    return UsersRepository.getDiaryWithMovies(userId);
  }

  static async getReviewsWithMovies(userId: string) {
    return UsersRepository.getReviewsWithMovies(userId);
  }

  static async getReviewDetailByUsername(
    username: string,
    reviewId: string,
    viewerUserId?: string | null,
  ) {
    return UsersRepository.getReviewDetailByUsername(username, reviewId, viewerUserId);
  }

  static async getWatchedFilms(userId: string) {
    return UsersRepository.getWatchedFilms(userId);
  }

  static async getLikedFilms(userId: string) {
    return UsersRepository.getLikedFilms(userId);
  }

  static async getWatchlistedFilms(userId: string) {
    return UsersRepository.getWatchlistedFilms(userId);
  }

  static async getStats(userId: string) {
    return UsersRepository.getStatsCounts(userId);
  }

  static async getMeSummary(userId: string) {
    const profile = await UsersProfileService.findById(userId);
    if (!profile) {
      return null;
    }

    const summaryData = await UsersRepository.getMeSummaryData(userId);
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
