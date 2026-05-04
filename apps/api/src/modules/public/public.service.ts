import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { user } from "../../infrastructure/database/auth.entity";
import { DiaryRepository } from "../diary/repositories/diary.repository";
import { listEntries, lists } from "../lists/lists.entity";
import { UsersService } from "../users/users.service";
import { movies } from "../movies/movies.entity";
import { reviews } from "../reviews/reviews.entity";
import { serialDiaryEntries, tvSeries } from "../serials/serials.entity";
import { SocialFeedService } from "../social/services/social-feed.service";
import { PublicTopPicksService } from "./services/public-top-picks.service";

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
    entryCount: number;
    reviewCount: number;
    filmCount: number;
    listCount: number;
    followerCount: number;
    followingCount: number;
  };
};

type PublicDiaryItem = {
  id: string;
  mediaType: "movie" | "tv";
  watchedDate: string;
  ratingOutOfTen: number | null;
  ratingOutOfFive: number | null;
  rewatch: boolean;
  createdAt: Date;
  updatedAt: Date;
  media: {
    tmdbId: number;
    title: string;
    posterPath: string | null;
    releaseYear: number | null;
  };
  review: {
    id: string;
    content: string;
    containsSpoilers: boolean;
    createdAt: Date;
  } | null;
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

const toRatingOutOfFive = (ratingOutOfTen: number | null): number | null => {
  if (ratingOutOfTen === null || !Number.isFinite(ratingOutOfTen)) {
    return null;
  }

  return Number((ratingOutOfTen / 2).toFixed(1));
};

const toTimestamp = (value: string | Date): number => {
  if (value instanceof Date) {
    return value.getTime();
  }

  return Date.parse(value);
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

    const reviews = await UsersService.getReviewsWithMovies(userId);
    return reviews.slice(0, limit);
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

  static async getDiary(username: string, limit = 50): Promise<PublicDiaryItem[] | null> {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    const [movieEntries, serialEntries] = await Promise.all([
      DiaryRepository.findAllByUser(userId),
      db
        .select({
          id: serialDiaryEntries.id,
          watchedDate: serialDiaryEntries.watchedDate,
          rating: serialDiaryEntries.rating,
          rewatch: serialDiaryEntries.rewatch,
          createdAt: serialDiaryEntries.createdAt,
          updatedAt: serialDiaryEntries.updatedAt,
          tmdbId: tvSeries.tmdbId,
          title: tvSeries.title,
          posterPath: tvSeries.posterPath,
          releaseYear: tvSeries.firstAirYear,
          reviewId: reviews.id,
          reviewContent: reviews.content,
          reviewContainsSpoilers: reviews.containsSpoilers,
          reviewCreatedAt: reviews.createdAt,
        })
        .from(serialDiaryEntries)
        .innerJoin(tvSeries, eq(tvSeries.id, serialDiaryEntries.seriesId))
        .leftJoin(
          reviews,
          and(
            eq(reviews.userId, serialDiaryEntries.userId),
            eq(reviews.diaryEntryId, serialDiaryEntries.id),
            eq(reviews.mediaType, "tv"),
          ),
        )
        .where(eq(serialDiaryEntries.userId, userId))
        .orderBy(desc(serialDiaryEntries.watchedDate), desc(serialDiaryEntries.createdAt)),
    ]);

    const normalizedMovieEntries: PublicDiaryItem[] = movieEntries.map((entry) => ({
      id: entry.id,
      mediaType: "movie",
      watchedDate: entry.watchedDate,
      ratingOutOfTen: entry.rating,
      ratingOutOfFive: toRatingOutOfFive(entry.rating),
      rewatch: entry.rewatch,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      media: {
        tmdbId: entry.movieTmdbId,
        title: entry.movieTitle,
        posterPath: entry.moviePosterPath,
        releaseYear: entry.movieReleaseYear,
      },
      review: entry.reviewId
        ? {
            id: entry.reviewId,
            content: entry.reviewContent ?? "",
            containsSpoilers: entry.reviewContainsSpoilers ?? false,
            createdAt: entry.reviewCreatedAt ?? entry.createdAt,
          }
        : null,
    }));

    const normalizedSerialEntries: PublicDiaryItem[] = serialEntries.map((entry) => ({
      id: entry.id,
      mediaType: "tv",
      watchedDate: entry.watchedDate,
      ratingOutOfTen: entry.rating,
      ratingOutOfFive: toRatingOutOfFive(entry.rating),
      rewatch: entry.rewatch,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      media: {
        tmdbId: entry.tmdbId,
        title: entry.title,
        posterPath: entry.posterPath,
        releaseYear: entry.releaseYear,
      },
      review: entry.reviewId
        ? {
            id: entry.reviewId,
            content: entry.reviewContent ?? "",
            containsSpoilers: entry.reviewContainsSpoilers ?? false,
            createdAt: entry.reviewCreatedAt ?? entry.createdAt,
          }
        : null,
    }));

    const combined = [...normalizedMovieEntries, ...normalizedSerialEntries]
      .sort((left, right) => {
        const watchedDateDelta =
          toTimestamp(right.watchedDate) - toTimestamp(left.watchedDate);

        if (watchedDateDelta !== 0) {
          return watchedDateDelta;
        }

        return toTimestamp(right.createdAt) - toTimestamp(left.createdAt);
      })
      .slice(0, limit);

    return combined;
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
