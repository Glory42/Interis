import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { user } from "../../infrastructure/database/auth.entity";
import { listEntries, lists } from "../lists/lists.entity";
import { UsersService } from "../users/users.service";
import { movies } from "../movies/movies.entity";
import { SocialFeedService } from "../social/services/social-feed.service";
import { PublicTopPicksService } from "./services/public-top-picks.service";
import { PublicDiaryService } from "./services/public-diary.service";

// Thin, read-only service for the public portfolio API
// All responses are cached-friendly — no auth required

type PublicProfileResponse = {
  username: string;
  displayUsername: string | null;
  name: string;
  image: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  favoriteGenres: string[];
  themeId: string;
  createdAt: Date;
  stats: {
    filmEntryCount: number;
    serialEntryCount: number;
    reviewCount: number;
    filmCount: number;
    listCount: number;
    followerCount: number;
    followingCount: number;
  };
};

type PublicListEntry = {
  position: number;
  note: string | null;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};

type PublicList = {
  id: string;
  title: string;
  description: string | null;
  isRanked: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  items: PublicListEntry[];
};

export class PublicService {
  private static async findUserIdByUsername(username: string): Promise<string | null> {
    const [profile] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username))
      .limit(1);

    return profile?.id ?? null;
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
      image: profile.image,
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

    const reviewList = await UsersService.getReviewsWithMovies(userId);
    return reviewList.slice(0, limit);
  }

  static async getLikes(username: string, limit = 50) {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    const likes = await UsersService.getLikedFilms(userId);
    return likes.slice(0, limit);
  }

  static async getWatchlist(username: string, limit = 50) {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    const watchlist = await UsersService.getWatchlistedFilms(userId);
    return watchlist.slice(0, limit);
  }

  static async getDiary(username: string, limit = 50) {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    return PublicDiaryService.getDiary(userId, limit);
  }

  static async getLists(username: string, limit = 20): Promise<PublicList[] | null> {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    const listRows = await db
      .select({
        id: lists.id,
        title: lists.title,
        description: lists.description,
        isRanked: lists.isRanked,
        createdAt: lists.createdAt,
        updatedAt: lists.updatedAt,
      })
      .from(lists)
      .where(and(eq(lists.userId, userId), eq(lists.isPublic, true)))
      .orderBy(desc(lists.updatedAt), desc(lists.createdAt))
      .limit(limit);

    if (listRows.length === 0) {
      return [];
    }

    const listIds = listRows.map((listRow) => listRow.id);

    const entryRows = await db
      .select({
        listId: listEntries.listId,
        position: listEntries.position,
        note: listEntries.note,
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
      })
      .from(listEntries)
      .innerJoin(movies, eq(movies.id, listEntries.movieId))
      .where(inArray(listEntries.listId, listIds))
      .orderBy(asc(listEntries.listId), asc(listEntries.position), asc(listEntries.createdAt));

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
}
