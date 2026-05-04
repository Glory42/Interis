import type { ThemeId } from "./constants/theme.constants";
import type { UpdateProfileDto } from "./dto/users.dto";
import { UsersLikesRepository } from "./repositories/users-likes.repository";
import { UsersProfileService } from "./services/users-profile.service";
import { UsersReadService } from "./services/users-read.service";

export class UsersService {
  static async getTotalUsersCount() {
    return UsersReadService.getTotalUsersCount();
  }

  static async getNetworkStats() {
    return UsersReadService.getNetworkStats();
  }

  static async searchUsers(query: string, limit?: number) {
    return UsersReadService.searchUsers(query, limit);
  }

  static async findByUsername(username: string) {
    return UsersProfileService.findByUsername(username);
  }

  static async findById(userId: string) {
    return UsersProfileService.findById(userId);
  }

  static async updateProfile(userId: string, input: UpdateProfileDto) {
    return UsersProfileService.updateProfile(userId, input);
  }

  static async updateTheme(userId: string, themeId: ThemeId) {
    return UsersProfileService.updateTheme(userId, themeId);
  }

  static async getReviewsWithMovies(userId: string) {
    return UsersReadService.getReviewsWithMovies(userId);
  }

  static async getReviewDetailByUsername(
    username: string,
    reviewId: string,
    viewerUserId?: string | null,
  ) {
    return UsersReadService.getReviewDetailByUsername(username, reviewId, viewerUserId);
  }

  static async getLikedFilms(userId: string) {
    return UsersReadService.getLikedFilms(userId);
  }

  static async getWatchlistedFilms(userId: string) {
    return UsersReadService.getWatchlistedFilms(userId);
  }

  static async getStats(userId: string) {
    return UsersReadService.getStats(userId);
  }

  static async getMeSummary(userId: string) {
    return UsersReadService.getMeSummary(userId);
  }

  static async getLikedReviews(userId: string) {
    return UsersLikesRepository.getLikedReviews(userId);
  }

  static async getLikedLists(userId: string) {
    return UsersLikesRepository.getLikedLists(userId);
  }
}
