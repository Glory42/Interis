import { UsersService } from "../users/users.service";
import { UsersMediaInteractionsRepository } from "../users/repositories/users-media-interactions.repository";
import type { WidgetProfileTab } from "../users/services/profile-tabs.service";
import { SocialFeedService } from "../social/services/social-feed.service";
import { groupFeedItems, takeVisibleRows } from "../social/helpers/social-feed-grouping.helper";
import { PublicRepository } from "./repositories/public.repository";

import type {
  PublicProfileResponse,
  PublicList,
  PublicListEntry,
} from "./dto/public.dto";
import { TvProgressService } from "../tv/services/tv-progress.service";
import { TvService } from "../tv/tv.service";

// Raw activity rows read for the grouped view, so a run of likes can't crowd out older days.
const RECENT_GROUPED_WINDOW = 100;

type WidgetQuery = Record<string, unknown>;

export class PublicService {
  // Widget reads of a Profile tab: the same data and paging rules as the in-app Profile.
  static async readTab<T extends WidgetProfileTab>(username: string, tab: T, query: WidgetQuery) {
    const read = await UsersService.readProfileTab(username, tab, query, { surface: "widget" });
    return read ? read.data : null;
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

  // One entry per title per day, `limit` visible rows long (a run of likes counts once).
  static async getRecentActivityGroupedByUserId(userId: string, limit = 10) {
    const items = await SocialFeedService.getUserActivityFeed(userId, RECENT_GROUPED_WINDOW);
    return takeVisibleRows(groupFeedItems(items), limit);
  }

  static async getActivity(username: string, limit = 30) {
    const userId = await UsersService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    return SocialFeedService.getUserActivityFeed(userId, limit);
  }

  static async getWatchedMovies(username: string, limit = 50) {
    const userId = await UsersService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    return UsersMediaInteractionsRepository.getWatchedMovies(userId, limit);
  }

  static async getSerialsWatched(username: string, limit = 50) {
    const userId = await UsersService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    const watched = await TvService.getWatchedSeries(userId, limit);
    return watched.slice(0, limit);
  }

  // The widget's likes and watchlist are the newest page of the shelf, without its totals.
  static async getShelfItems(username: string, tab: "likes" | "watchlist", limit: unknown) {
    const shelf = await PublicService.readTab(username, tab, { limit });
    return shelf ? shelf.items : null;
  }

  static async getLists(username: string, limit = 20): Promise<PublicList[] | null> {
    const userId = await UsersService.findUserIdByUsername(username);
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

  static async getSerialProgress(username: string, tmdbId: number) {
    const userId = await UsersService.findUserIdByUsername(username);
    if (!userId) return null;

    return TvProgressService.getProgress(tmdbId, userId);
  }
}
