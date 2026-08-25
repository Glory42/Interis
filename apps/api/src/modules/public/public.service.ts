import { UsersService } from "../users/users.service";
import { SocialFeedService } from "../social/services/social-feed.service";
import { PublicRepository } from "./repositories/public.repository";
import { PublicTopPicksService } from "./services/public-top-picks.service";
import { PublicDiaryService } from "./services/public-diary.service";
import type {
  PublicProfileResponse,
  PublicCurrentlyWatchingSeries,
  PublicDiaryItem,
  PublicList,
  PublicListEntry,
} from "./dto/public.dto";
import { SerialsDetailService } from "../serials/services/serials-detail.service";
import { SerialsCurrentlyWatchingService } from "../serials/services/serials-currently-watching.service";
import { SerialsService } from "../serials/serials.service";

export class PublicService {
  private static findUserIdByUsername(username: string): Promise<string | null> {
    return PublicRepository.findUserIdByUsername(username);
  }

  static async getProfile(username: string): Promise<PublicProfileResponse | null> {
    const profile = await UsersService.findByUsername(username);
    if (!profile) {
      return null;
    }

    const stats = await UsersService.getStats(profile.id);

    return {
      username: profile.username,
      displayUsername: profile.displayUsername,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      location: profile.location,
      favoriteGenres: profile.favoriteGenres ?? [],
      themeId: profile.themeId,
      createdAt: profile.createdAt,
      stats,
    };
  }

  static async getRecentActivity(username: string, limit = 10) {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) return null;

    return SocialFeedService.getUserActivityFeed(userId, limit);
  }

  static async getActivity(username: string, limit = 30) {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    return SocialFeedService.getUserActivityFeed(userId, limit);
  }

  static async getReviews(username: string, limit = 50) {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    const allReviews = await UsersService.getReviewsWithMovies(userId, limit);
    return allReviews.slice(0, limit);
  }

  static async getWatchedFilms(username: string, limit = 50) {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    const watched = await UsersService.getWatchedFilms(userId, limit);
    return watched.slice(0, limit);
  }

  static async getSerialsWatched(username: string, limit = 50) {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    const watched = await SerialsService.getWatchedSeries(userId, limit);
    return watched.slice(0, limit);
  }

  static async getLikes(username: string, limit = 50) {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    const likes = await UsersService.getLikedFilms(userId, limit);
    return likes.slice(0, limit);
  }

  static async getWatchlist(username: string, limit = 50) {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    const watchlist = await UsersService.getWatchlistedFilms(userId, limit);
    return watchlist.slice(0, limit);
  }

  static async getDiary(
    username: string,
    limit = 50,
    offset = 0,
  ): Promise<PublicDiaryItem[] | null> {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    return PublicDiaryService.getDiary(userId, limit, offset);
  }

  static async getLists(username: string, limit = 20): Promise<PublicList[] | null> {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    const listRows = await PublicRepository.findPublicListsByUser(userId, limit);

    if (listRows.length === 0) {
      return [];
    }

    const listIds = listRows.map((listRow) => listRow.id);

    const entryRows = await PublicRepository.findListEntriesByListIds(listIds);

    const entriesByListId = new Map<string, PublicListEntry[]>();

    for (const entryRow of entryRows) {
      const existingEntries = entriesByListId.get(entryRow.listId) ?? [];
      existingEntries.push({
        position: entryRow.position,
        note: entryRow.note,
        tmdbId: entryRow.tmdbId,
        title: entryRow.title,
        posterPath: entryRow.posterPath,
        releaseYear: entryRow.releaseYear,
      });

      entriesByListId.set(entryRow.listId, existingEntries);
    }

    return listRows.map((listRow) => {
      const items = entriesByListId.get(listRow.id) ?? [];

      return {
        id: listRow.id,
        title: listRow.title,
        description: listRow.description,
        isRanked: listRow.isRanked,
        createdAt: listRow.createdAt,
        updatedAt: listRow.updatedAt,
        itemCount: items.length,
        items,
      };
    });
  }

  static async getTop4(username: string) {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    return PublicTopPicksService.getTop4ByUserId(userId);
  }

  static async getSerialsCurrentlyWatching(
    username: string,
    limit: number,
  ): Promise<PublicCurrentlyWatchingSeries[] | null> {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) return null;

    return SerialsCurrentlyWatchingService.getCurrentlyWatching(userId, limit);
  }

  static async getSerialProgress(username: string, tmdbId: number) {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) return null;

    const detail = await SerialsDetailService.getDetail({
      tmdbId,
      viewerUserId: userId,
      reviewsSort: "recent",
    });

    if (!detail) return null;

    return {
      series: {
        id: detail.series.id,
        tmdbId: detail.series.tmdbId,
        title: detail.series.title,
        posterPath: detail.series.posterPath,
        numberOfSeasons: detail.series.numberOfSeasons,
        numberOfEpisodes: detail.series.numberOfEpisodes,
      },
      viewerTracking: detail.viewerTracking,
      seasons: detail.series.seasons.map((s) => ({
        seasonNumber: s.seasonNumber,
        name: s.name,
        episodeCount: s.episodeCount,
        viewerInteraction: s.viewerInteraction,
      })),
    };
  }
}
