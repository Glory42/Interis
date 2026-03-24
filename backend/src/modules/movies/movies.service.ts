import { and, desc, eq } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { movies } from "./movies.entity";
import {
  searchMovies as tmdbSearch,
  getNowPlayingMovies as tmdbNowPlaying,
  getMovieDetails as tmdbGetDetails,
  type TMDBSearchMovie,
  type TMDBMovieDetail,
} from "../../infrastructure/tmdb/client";
import { diaryEntries } from "../diary/diary.entity";
import { reviews } from "../reviews/reviews.entity";
import { profiles } from "../users/users.entity";
import { user } from "../../infrastructure/database/auth.entity";

export class MoviesService {
  static async search(query: string): Promise<TMDBSearchMovie[]> {
    return tmdbSearch(query);
  }

  static async getRecent(): Promise<TMDBSearchMovie[]> {
    return tmdbNowPlaying();
  }

  static async findOrCreate(tmdbId: number) {
    const [existing] = await db
      .select()
      .from(movies)
      .where(eq(movies.tmdbId, tmdbId))
      .limit(1);

    if (existing) return existing;

    const tmdbData = await tmdbGetDetails(tmdbId);
    return MoviesService.cacheMovie(tmdbData);
  }

  static async cacheMovie(tmdbData: TMDBMovieDetail) {
    const releaseYear = tmdbData.release_date
      ? new Date(tmdbData.release_date).getFullYear()
      : null;

    const [inserted] = await db
      .insert(movies)
      .values({
        tmdbId: tmdbData.id,
        title: tmdbData.title,
        originalTitle: tmdbData.original_title || null,
        posterPath: tmdbData.poster_path,
        backdropPath: tmdbData.backdrop_path,
        releaseYear,
        runtime: tmdbData.runtime,
        overview: tmdbData.overview || null,
        tagline: tmdbData.tagline || null,
        genres: tmdbData.genres,
      })
      .onConflictDoUpdate({
        target: movies.tmdbId,
        set: {
          title: tmdbData.title,
          posterPath: tmdbData.poster_path,
          backdropPath: tmdbData.backdrop_path,
          cachedAt: new Date(),
        },
      })
      .returning();

    return inserted;
  }

  static async getLogsByTmdbId(tmdbId: number) {
    const movie = await MoviesService.findOrCreate(tmdbId);
    if (!movie) {
      return [];
    }

    return db
      .select({
        diaryEntryId: diaryEntries.id,
        watchedDate: diaryEntries.watchedDate,
        rating: diaryEntries.rating,
        rewatch: diaryEntries.rewatch,
        createdAt: diaryEntries.createdAt,
        username: profiles.username,
        userDisplayName: user.name,
        avatarUrl: profiles.avatarUrl,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewUpdatedAt: reviews.updatedAt,
      })
      .from(diaryEntries)
      .innerJoin(profiles, eq(profiles.userId, diaryEntries.userId))
      .innerJoin(user, eq(user.id, diaryEntries.userId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, diaryEntries.userId),
          eq(reviews.movieId, diaryEntries.movieId),
        ),
      )
      .where(eq(diaryEntries.movieId, movie.id))
      .orderBy(desc(diaryEntries.createdAt));
  }
}
