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

  static async getPublicProfileWithStats(username: string) {
    const profile = await UsersProfileService.findByUsername(username);
    if (!profile) {
      return null;
    }

    const stats = await UsersReadService.getStats(profile.id);
    const { email: _email, ...publicProfile } = profile;
    return { ...publicProfile, stats };
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

  static async setAdminStatus(userId: string, isAdmin: boolean) {
    return UsersProfileService.setAdminStatus(userId, isAdmin);
  }

  static async setSuspended(userId: string, isSuspended: boolean, reason?: string) {
    return UsersProfileService.setSuspended(userId, isSuspended, reason);
  }

  static async getReviewsWithMovies(userId: string, limit?: number, offset?: number) {
    return UsersReadService.getReviewsWithMovies(userId, limit, offset);
  }

  static async getReviewDetailByUsername(
    username: string,
    reviewId: string,
    viewerUserId?: string | null,
  ) {
    return UsersReadService.getReviewDetailByUsername(username, reviewId, viewerUserId);
  }

  static async getWatchedFilms(userId: string, limit?: number, offset?: number) {
    return UsersReadService.getWatchedFilms(userId, limit, offset);
  }

  static async getLikedFilms(userId: string, limit?: number, offset?: number) {
    return UsersReadService.getLikedFilms(userId, limit, offset);
  }

  static async getWatchlistedFilms(userId: string, limit?: number, offset?: number) {
    return UsersReadService.getWatchlistedFilms(userId, limit, offset);
  }

  static async getStats(userId: string) {
    return UsersReadService.getStats(userId);
  }

  static async getDetailedStats(userId: string) {
    return UsersReadService.getDetailedStats(userId);
  }

  static async getMeSummary(userId: string) {
    return UsersReadService.getMeSummary(userId);
  }

  static async getLikedReviews(userId: string, limit?: number, offset?: number) {
    return UsersLikesRepository.getLikedReviews(userId, limit, offset);
  }

  static async getLikedLists(userId: string, limit?: number, offset?: number) {
    return UsersLikesRepository.getLikedLists(userId, limit, offset);
  }
}
