import { eq, desc, inArray } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { user } from "../../infrastructure/database/auth.entity";
import { profiles } from "../users/users.entity";
import { diaryEntries } from "../diary/diary.entity";
import { movies } from "../movies/movies.entity";
import { movieInteractions } from "../interactions/interactions.entity";
import { getMovieDirector } from "../../infrastructure/tmdb/client";

// Thin, read-only service for the public portfolio API
// All responses are cached-friendly — no auth required

export class PublicService {
  static async getRecentActivity(username: string, limit = 10) {
    const [profile] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username))
      .limit(1);

    if (!profile) return null;

    return db
      .select({
        watchedDate: diaryEntries.watchedDate,
        rating: diaryEntries.rating,
        rewatch: diaryEntries.rewatch,
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
      })
      .from(diaryEntries)
      .innerJoin(movies, eq(diaryEntries.movieId, movies.id))
      .where(eq(diaryEntries.userId, profile.id))
      .orderBy(desc(diaryEntries.watchedDate))
      .limit(limit);
  }

  static async getTop4(username: string) {
    const [profileRow] = await db
      .select({ top4MovieIds: profiles.top4MovieIds })
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .where(eq(user.username, username))
      .limit(1);

    if (!profileRow || !profileRow.top4MovieIds?.length) return null;

    // Fetch all saved movies in one query, then restore profile order
    const fetchedRows = await db
      .select({
        id: movies.id,
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
      })
      .from(movies)
      .where(inArray(movies.id, profileRow.top4MovieIds));

    const byId = new Map(fetchedRows.map((row) => [row.id, row]));
    const rows = profileRow.top4MovieIds.map((movieId) => byId.get(movieId) ?? null);

    const rowsWithDirector = await Promise.all(
      rows.map(async (row) => {
        if (!row) {
          return null;
        }

        try {
          const director = await getMovieDirector(row.tmdbId);
          return {
            ...row,
            director,
          };
        } catch {
          return {
            ...row,
            director: null,
          };
        }
      }),
    );

    return rowsWithDirector.filter(Boolean);
  }

  static async getStats(username: string) {
    const [profileRow] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username))
      .limit(1);

    if (!profileRow) return null;

    const [diaryRows, likedRows] = await Promise.all([
      db
        .select({
          rating: diaryEntries.rating,
          rewatch: diaryEntries.rewatch,
        })
        .from(diaryEntries)
        .where(eq(diaryEntries.userId, profileRow.id)),
      db
        .select({ movieId: movieInteractions.movieId })
        .from(movieInteractions)
        .where(eq(movieInteractions.userId, profileRow.id)),
    ]);

    const watched = diaryRows.length;
    const rewatches = diaryRows.filter((r) => r.rewatch).length;
    const rated = diaryRows.filter((r) => r.rating !== null).length;
    const liked = likedRows.length;

    const avgRating =
      rated > 0
        ? diaryRows.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated / 2
        : null; // divide by 2 to convert 1-10 → 0.5-5.0

    return { watched, rewatches, rated, liked, avgRating };
  }
}
