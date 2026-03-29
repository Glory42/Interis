import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { profiles } from "./users.entity";
import { user } from "../../infrastructure/database/auth.entity";
import { diaryEntries } from "../diary/diary.entity";
import { reviews } from "../reviews/reviews.entity";
import { movies } from "../movies/movies.entity";
import { movieInteractions } from "../interactions/interactions.entity";
import { follows } from "../social/social.entity";
import { lists } from "../lists/lists.entity";
import { normalizeThemeId, type ThemeId } from "./constants/theme.constants";
import type { UpdateProfileDto } from "./dto/users.dto";

const profileSelect = {
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image,
  username: user.username,
  displayUsername: user.displayUsername,
  bio: profiles.bio,
  location: profiles.location,
  avatarUrl: profiles.avatarUrl,
  backdropUrl: profiles.backdropUrl,
  top4MovieIds: profiles.top4MovieIds,
  favoriteGenres: profiles.favoriteGenres,
  themeId: profiles.themeId,
  isAdmin: profiles.isAdmin,
  createdAt: profiles.createdAt,
} as const;

export class UsersService {
  static async findByUsername(username: string) {
    const [result] = await db
      .select(profileSelect)
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .where(eq(user.username, username))
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      ...result,
      themeId: normalizeThemeId(result.themeId),
    };
  }

  static async findById(userId: string) {
    const [result] = await db
      .select(profileSelect)
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      ...result,
      themeId: normalizeThemeId(result.themeId),
    };
  }

  static async updateProfile(userId: string, input: UpdateProfileDto) {
    const [updated] = await db
      .update(profiles)
      .set({
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        ...(input.backdropUrl !== undefined && {
          backdropUrl: input.backdropUrl,
        }),
        ...(input.top4MovieIds !== undefined && {
          top4MovieIds: input.top4MovieIds,
        }),
        ...(input.favoriteGenres !== undefined && {
          favoriteGenres: input.favoriteGenres,
        }),
      })
      .where(eq(profiles.userId, userId))
      .returning();

    return updated ?? null;
  }

  static async updateTheme(userId: string, themeId: ThemeId) {
    const [updated] = await db
      .update(profiles)
      .set({ themeId })
      .where(eq(profiles.userId, userId))
      .returning({ themeId: profiles.themeId });

    if (!updated) {
      return null;
    }

    return {
      themeId: normalizeThemeId(updated.themeId),
    };
  }

  static async getDiaryWithMovies(userId: string) {
    return db
      .select({
        id: diaryEntries.id,
        watchedDate: diaryEntries.watchedDate,
        rating: diaryEntries.rating,
        rewatch: diaryEntries.rewatch,
        movieId: diaryEntries.movieId,
        createdAt: diaryEntries.createdAt,
        updatedAt: diaryEntries.updatedAt,
        movieTmdbId: movies.tmdbId,
        movieTitle: movies.title,
        moviePosterPath: movies.posterPath,
        movieReleaseYear: movies.releaseYear,
        reviewId: reviews.id,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewCreatedAt: reviews.createdAt,
      })
      .from(diaryEntries)
      .innerJoin(movies, eq(diaryEntries.movieId, movies.id))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, diaryEntries.userId),
          eq(reviews.movieId, diaryEntries.movieId),
        ),
      )
      .where(eq(diaryEntries.userId, userId))
      .orderBy(desc(diaryEntries.watchedDate), desc(diaryEntries.createdAt));
  }

  static async getReviewsWithMovies(userId: string) {
    return db
      .select({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
      })
      .from(reviews)
      .innerJoin(movies, eq(reviews.movieId, movies.id))
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  static async getWatchedFilms(userId: string) {
    return db
      .selectDistinctOn([movies.id], {
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
        genres: movies.genres,
        runtime: movies.runtime,
        // Most recent watch date for this film
        lastWatched: diaryEntries.watchedDate,
      })
      .from(diaryEntries)
      .innerJoin(movies, eq(diaryEntries.movieId, movies.id))
      .where(eq(diaryEntries.userId, userId))
      .orderBy(movies.id, desc(diaryEntries.watchedDate));
  }

  static async getLikedFilms(userId: string) {
    return db
      .select({
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
      })
      .from(movieInteractions)
      .innerJoin(movies, eq(movieInteractions.movieId, movies.id))
      .where(eq(movieInteractions.userId, userId));
  }

  static async getStats(userId: string) {
    const [entryRows, reviewRows, filmRows, listRows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(diaryEntries)
        .where(eq(diaryEntries.userId, userId)),
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(reviews)
        .where(eq(reviews.userId, userId)),
      db
        .select({ count: sql<number>`count(distinct ${diaryEntries.movieId})`.mapWith(Number) })
        .from(diaryEntries)
        .where(eq(diaryEntries.userId, userId)),
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(lists)
        .where(eq(lists.userId, userId)),
    ]);

    return {
      entryCount: entryRows[0]?.count ?? 0,
      reviewCount: reviewRows[0]?.count ?? 0,
      filmCount: filmRows[0]?.count ?? 0,
      listCount: listRows[0]?.count ?? 0,
    };
  }

  static async getMeSummary(userId: string) {
    const profile = await UsersService.findById(userId);
    if (!profile) {
      return null;
    }

    const [logCountRows, followerCountRows, followingCountRows, recentRows] =
      await Promise.all([
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(diaryEntries)
          .where(eq(diaryEntries.userId, userId)),
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(follows)
          .where(eq(follows.followingId, userId)),
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(follows)
          .where(eq(follows.followerId, userId)),
        db
          .select({
            tmdbId: movies.tmdbId,
            title: movies.title,
            posterPath: movies.posterPath,
          })
          .from(diaryEntries)
          .innerJoin(movies, eq(diaryEntries.movieId, movies.id))
          .where(eq(diaryEntries.userId, userId))
          .orderBy(desc(diaryEntries.watchedDate), desc(diaryEntries.createdAt))
          .limit(20),
      ]);

    const dedupedRecentPosters: Array<{
      tmdbId: number;
      title: string;
      posterPath: string | null;
    }> = [];

    const seenTmdbIds = new Set<number>();
    for (const row of recentRows) {
      if (seenTmdbIds.has(row.tmdbId)) {
        continue;
      }

      seenTmdbIds.add(row.tmdbId);
      dedupedRecentPosters.push(row);

      if (dedupedRecentPosters.length >= 5) {
        break;
      }
    }

    return {
      id: profile.id,
      username: profile.username,
      displayUsername: profile.displayUsername,
      image: profile.image,
      avatarUrl: profile.avatarUrl,
      counts: {
        logs: logCountRows[0]?.count ?? 0,
        followers: followerCountRows[0]?.count ?? 0,
        following: followingCountRows[0]?.count ?? 0,
      },
      recentPosters: dedupedRecentPosters,
    };
  }
}
