import type { SuspensionOptions } from "./repositories/users-profile.repository";
import { normalizeThemeId, type ThemeId } from "./constants/theme.constants";
import type { UpdateProfileDto } from "./dto/users.dto";
import { dedupeRecentPosters } from "./helpers/users-summary.helper";
import { UsersProfileRepository } from "./repositories/users-profile.repository";
import { UsersReviewsRepository } from "./repositories/users-reviews.repository";
import { UsersStatsRepository } from "./repositories/users-stats.repository";
import {
  ProfileTabsService,
  type ProfileTab,
  type ProfileTabReadOptions,
} from "./services/profile-tabs.service";

const withNormalizedTheme = <T extends { themeId: string }>(row: T | null) =>
  row ? { ...row, themeId: normalizeThemeId(row.themeId) } : null;

export class UsersService {
  static async readProfileTab<T extends ProfileTab>(
    username: string,
    tab: T,
    query: Record<string, unknown>,
    options?: ProfileTabReadOptions,
  ) {
    return ProfileTabsService.read(username, tab, query, options);
  }

  static async getNetworkStats() {
    return UsersStatsRepository.getNetworkStats();
  }

  static async searchUsers(query: string, limit = 8) {
    return UsersProfileRepository.searchProfilesByUsername(query, limit);
  }

  static async findUserIdByUsername(username: string) {
    return UsersProfileRepository.findUserIdByUsername(username);
  }

  static async findByUsername(username: string) {
    return withNormalizedTheme(await UsersProfileRepository.findProfileByUsername(username));
  }

  static async findById(userId: string) {
    return withNormalizedTheme(await UsersProfileRepository.findProfileById(userId));
  }

  static async getPublicProfileWithStats(username: string) {
    const profile = await UsersService.findByUsername(username);
    if (!profile) {
      return null;
    }

    const stats = await UsersStatsRepository.getStatsCounts(profile.id);
    const { email: _email, ...publicProfile } = profile;
    return { ...publicProfile, stats };
  }

  static async updateProfile(userId: string, input: UpdateProfileDto) {
    return UsersProfileRepository.updateProfile(userId, input);
  }

  static async updateTheme(userId: string, themeId: ThemeId) {
    const updated = await UsersProfileRepository.updateTheme(userId, themeId);
    return updated ? { themeId: normalizeThemeId(updated.themeId) } : null;
  }

  static async setAdminStatus(userId: string, isAdmin: boolean) {
    return UsersProfileRepository.setAdminStatus(userId, isAdmin);
  }

  static async setSuspended(userId: string, isSuspended: boolean, reason?: string, options?: SuspensionOptions) {
    return UsersProfileRepository.setSuspended(userId, isSuspended, reason, options);
  }

  static async getReviewDetailByUsername(
    username: string,
    reviewId: string,
    viewerUserId?: string | null,
  ) {
    return UsersReviewsRepository.getReviewDetailByUsername(username, reviewId, viewerUserId);
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
    // "Your week" on the feed: the last seven days, today included.
    const weekStart = new Date(Date.now() - 6 * 86_400_000);
    const [profile, summaryData, week] = await Promise.all([
      UsersService.findById(userId),
      UsersStatsRepository.getMeSummaryData(userId),
      UsersStatsRepository.getWeekSummary(userId, weekStart.toISOString().slice(0, 10), weekStart),
    ]);
    if (!profile) {
      return null;
    }

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
      recentPosters: dedupeRecentPosters(summaryData.recentRows, 5),
      week,
    };
  }
}
