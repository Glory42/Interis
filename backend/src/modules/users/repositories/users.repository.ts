import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { diaryEntries } from "../../diary/diary.entity";
import { movieInteractions } from "../../interactions/interactions.entity";
import { lists } from "../../lists/lists.entity";
import { movies } from "../../movies/movies.entity";
import { comments, reviewLikes, reviews } from "../../reviews/reviews.entity";
import {
  serialDiaryEntries,
  tvSeries,
} from "../../serials/serials.entity";
import { follows } from "../../social/social.entity";
import { profiles } from "../users.entity";
import type { ThemeId } from "../constants/theme.constants";
import type { UpdateProfileDto } from "../dto/users.dto";

const toRatingOutOfFive = (ratingOutOfTen: number | null): number | null => {
  if (ratingOutOfTen === null) {
    return null;
  }

  return Number((ratingOutOfTen / 2).toFixed(1));
};

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

export class UsersRepository {
  static async findProfileByUsername(username: string) {
    const [result] = await db
      .select(profileSelect)
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .where(eq(user.username, username))
      .limit(1);

    return result ?? null;
  }

  static async findProfileById(userId: string) {
    const [result] = await db
      .select(profileSelect)
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .where(eq(profiles.userId, userId))
      .limit(1);

    return result ?? null;
  }

  static async searchProfilesByUsername(query: string, limit: number) {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return [];
    }

    const containsPattern = `%${normalizedQuery}%`;
    const prefixPattern = `${normalizedQuery}%`;

    return db
      .select({
        id: user.id,
        username: user.username,
        displayUsername: user.displayUsername,
        image: user.image,
        avatarUrl: profiles.avatarUrl,
      })
      .from(user)
      .leftJoin(profiles, eq(user.id, profiles.userId))
      .where(ilike(user.username, containsPattern))
      .orderBy(
        sql<number>`case
          when lower(${user.username}) = ${normalizedQuery} then 0
          when lower(${user.username}) like ${prefixPattern} then 1
          else 2
        end`,
        asc(user.username),
      )
      .limit(limit);
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

    return updated ?? null;
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
          eq(reviews.mediaType, "movie"),
        ),
      )
      .where(eq(diaryEntries.userId, userId))
      .orderBy(desc(diaryEntries.watchedDate), desc(diaryEntries.createdAt));
  }

  static async getReviewsWithMovies(userId: string) {
    const [movieReviewRows, tvReviewRows] = await Promise.all([
      db
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
          mediaType: sql<"movie">`'movie'`,
        })
        .from(reviews)
        .innerJoin(movies, eq(reviews.movieId, movies.id))
        .where(and(eq(reviews.userId, userId), eq(reviews.mediaType, "movie"))),
      db
        .select({
          id: reviews.id,
          content: reviews.content,
          containsSpoilers: reviews.containsSpoilers,
          createdAt: reviews.createdAt,
          updatedAt: reviews.updatedAt,
          tmdbId: reviews.mediaSourceId,
          mediaType: sql<"tv">`'tv'`,
        })
        .from(reviews)
        .where(and(eq(reviews.userId, userId), eq(reviews.mediaType, "tv"))),
    ]);

    const tvTmdbIds = tvReviewRows
      .map((reviewRow) => Number(reviewRow.tmdbId))
      .filter((tmdbId) => Number.isInteger(tmdbId) && tmdbId > 0);

    const tvRows = tvTmdbIds.length
      ? await db
          .select({
            tmdbId: tvSeries.tmdbId,
            title: tvSeries.title,
            posterPath: tvSeries.posterPath,
            releaseYear: tvSeries.firstAirYear,
          })
          .from(tvSeries)
          .where(inArray(tvSeries.tmdbId, [...new Set(tvTmdbIds)]))
      : [];

    const tvByTmdbId = new Map(tvRows.map((tvRow) => [tvRow.tmdbId, tvRow]));

    const serialReviewRows = tvReviewRows
      .map((reviewRow) => {
        const tmdbId = Number(reviewRow.tmdbId);
        if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
          return null;
        }

        const series = tvByTmdbId.get(tmdbId);

        return {
          id: reviewRow.id,
          content: reviewRow.content,
          containsSpoilers: reviewRow.containsSpoilers,
          createdAt: reviewRow.createdAt,
          updatedAt: reviewRow.updatedAt,
          tmdbId,
          title: series?.title ?? "Unknown series",
          posterPath: series?.posterPath ?? null,
          releaseYear: series?.releaseYear ?? null,
          mediaType: "tv" as const,
        };
      })
      .filter((reviewRow): reviewRow is NonNullable<typeof reviewRow> => reviewRow !== null);

    return [...movieReviewRows, ...serialReviewRows].sort(
      (leftReview, rightReview) =>
        rightReview.createdAt.getTime() - leftReview.createdAt.getTime(),
    );
  }

  static async getReviewDetailByUsername(
    username: string,
    reviewId: string,
    viewerUserId?: string | null,
  ) {
    const [reviewRow] = await db
      .select({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        diaryEntryId: reviews.diaryEntryId,
        mediaType: reviews.mediaType,
        mediaSourceId: reviews.mediaSourceId,
        movieId: reviews.movieId,
        authorId: user.id,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorImage: user.image,
        authorAvatarUrl: profiles.avatarUrl,
      })
      .from(reviews)
      .innerJoin(user, eq(reviews.userId, user.id))
      .leftJoin(profiles, eq(profiles.userId, user.id))
      .where(and(eq(user.username, username), eq(reviews.id, reviewId)))
      .limit(1);

    if (!reviewRow) {
      return null;
    }

    const [likeRow, commentRow, viewerLikeRow] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int`.as("count") })
        .from(reviewLikes)
        .where(eq(reviewLikes.reviewId, reviewId))
        .limit(1),
      db
        .select({ count: sql<number>`count(*)::int`.as("count") })
        .from(comments)
        .where(eq(comments.reviewId, reviewId))
        .limit(1),
      viewerUserId
        ? db
            .select({ reviewId: reviewLikes.reviewId })
            .from(reviewLikes)
            .where(
              and(
                eq(reviewLikes.userId, viewerUserId),
                eq(reviewLikes.reviewId, reviewId),
              ),
            )
            .limit(1)
        : Promise.resolve([]),
    ]);

    if (reviewRow.mediaType === "movie") {
      const [movieRow, diaryRow] = await Promise.all([
        reviewRow.movieId !== null
          ? db
              .select({
                tmdbId: movies.tmdbId,
                title: movies.title,
                posterPath: movies.posterPath,
                releaseYear: movies.releaseYear,
                genres: movies.genres,
                director: movies.director,
              })
              .from(movies)
              .where(eq(movies.id, reviewRow.movieId))
              .limit(1)
          : Promise.resolve([]),
        reviewRow.diaryEntryId
          ? db
              .select({ ratingOutOfTen: diaryEntries.rating })
              .from(diaryEntries)
              .where(eq(diaryEntries.id, reviewRow.diaryEntryId))
              .limit(1)
          : Promise.resolve([]),
      ]);

      const tmdbId = movieRow[0]?.tmdbId ?? Number(reviewRow.mediaSourceId);

      if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
        return null;
      }

      const ratingOutOfTen = diaryRow[0]?.ratingOutOfTen ?? null;

      return {
        id: reviewRow.id,
        mediaType: "movie" as const,
        content: reviewRow.content,
        containsSpoilers: reviewRow.containsSpoilers,
        createdAt: reviewRow.createdAt,
        updatedAt: reviewRow.updatedAt,
        ratingOutOfTen,
        ratingOutOfFive: toRatingOutOfFive(ratingOutOfTen),
        author: {
          id: reviewRow.authorId,
          username: reviewRow.authorUsername,
          displayUsername: reviewRow.authorDisplayUsername,
          image: reviewRow.authorImage,
          avatarUrl: reviewRow.authorAvatarUrl,
        },
        media: {
          tmdbId,
          title: movieRow[0]?.title ?? "Unknown movie",
          posterPath: movieRow[0]?.posterPath ?? null,
          releaseYear: movieRow[0]?.releaseYear ?? null,
          genres: movieRow[0]?.genres ?? [],
          director: movieRow[0]?.director ?? null,
          creator: null,
        },
        engagement: {
          likeCount: likeRow[0]?.count ?? 0,
          commentCount: commentRow[0]?.count ?? 0,
          viewerHasLiked: viewerUserId ? viewerLikeRow.length > 0 : null,
        },
      };
    }

    if (reviewRow.mediaType === "tv") {
      const tmdbId = Number(reviewRow.mediaSourceId);
      if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
        return null;
      }

      const [seriesRow, serialDiaryRow] = await Promise.all([
        db
          .select({
            tmdbId: tvSeries.tmdbId,
            title: tvSeries.title,
            posterPath: tvSeries.posterPath,
            releaseYear: tvSeries.firstAirYear,
            genres: tvSeries.genres,
            creator: tvSeries.creator,
          })
          .from(tvSeries)
          .where(eq(tvSeries.tmdbId, tmdbId))
          .limit(1),
        reviewRow.diaryEntryId
          ? db
              .select({ ratingOutOfTen: serialDiaryEntries.rating })
              .from(serialDiaryEntries)
              .where(eq(serialDiaryEntries.id, reviewRow.diaryEntryId))
              .limit(1)
          : Promise.resolve([]),
      ]);

      const ratingOutOfTen = serialDiaryRow[0]?.ratingOutOfTen ?? null;

      return {
        id: reviewRow.id,
        mediaType: "tv" as const,
        content: reviewRow.content,
        containsSpoilers: reviewRow.containsSpoilers,
        createdAt: reviewRow.createdAt,
        updatedAt: reviewRow.updatedAt,
        ratingOutOfTen,
        ratingOutOfFive: toRatingOutOfFive(ratingOutOfTen),
        author: {
          id: reviewRow.authorId,
          username: reviewRow.authorUsername,
          displayUsername: reviewRow.authorDisplayUsername,
          image: reviewRow.authorImage,
          avatarUrl: reviewRow.authorAvatarUrl,
        },
        media: {
          tmdbId,
          title: seriesRow[0]?.title ?? "Unknown series",
          posterPath: seriesRow[0]?.posterPath ?? null,
          releaseYear: seriesRow[0]?.releaseYear ?? null,
          genres: seriesRow[0]?.genres ?? [],
          director: null,
          creator: seriesRow[0]?.creator ?? null,
        },
        engagement: {
          likeCount: likeRow[0]?.count ?? 0,
          commentCount: commentRow[0]?.count ?? 0,
          viewerHasLiked: viewerUserId ? viewerLikeRow.length > 0 : null,
        },
      };
    }

    return null;
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
        runtime: movies.runtime,
        genres: movies.genres,
        lastInteractionAt: movieInteractions.updatedAt,
      })
      .from(movieInteractions)
      .innerJoin(movies, eq(movieInteractions.movieId, movies.id))
      .where(and(eq(movieInteractions.userId, userId), eq(movieInteractions.liked, true)))
      .orderBy(desc(movieInteractions.updatedAt));
  }

  static async getWatchlistedFilms(userId: string) {
    return db
      .select({
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
        runtime: movies.runtime,
        genres: movies.genres,
        lastInteractionAt: movieInteractions.updatedAt,
      })
      .from(movieInteractions)
      .innerJoin(movies, eq(movieInteractions.movieId, movies.id))
      .where(
        and(
          eq(movieInteractions.userId, userId),
          eq(movieInteractions.watchlisted, true),
        ),
      )
      .orderBy(desc(movieInteractions.updatedAt));
  }

  static async getStatsCounts(userId: string) {
    const [
      entryRows,
      reviewRows,
      filmRows,
      listRows,
      followerRows,
      followingRows,
    ] = await Promise.all([
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
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(follows)
        .where(eq(follows.followingId, userId)),
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(follows)
        .where(eq(follows.followerId, userId)),
    ]);

    return {
      entryCount: entryRows[0]?.count ?? 0,
      reviewCount: reviewRows[0]?.count ?? 0,
      filmCount: filmRows[0]?.count ?? 0,
      listCount: listRows[0]?.count ?? 0,
      followerCount: followerRows[0]?.count ?? 0,
      followingCount: followingRows[0]?.count ?? 0,
    };
  }

  static async getMeSummaryData(userId: string) {
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

    return {
      logs: logCountRows[0]?.count ?? 0,
      followers: followerCountRows[0]?.count ?? 0,
      following: followingCountRows[0]?.count ?? 0,
      recentRows,
    };
  }
}
