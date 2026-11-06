import { and, asc, count, desc, eq, sql, type AnyColumn, type SQL } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { applyOptionalPagination } from "../../../commons/helpers/db-pagination.helper";
import { movieInteractions } from "../../interactions/interactions.entity";
import { movies } from "../../movies/movies.entity";
import { serialInteractions, tvSeries } from "../../serials/serials.entity";

import type { ProfileShelfSort, ProfileShelfType } from "../dto/users.dto";
import { compareShelfRows } from "../helpers/users-shelf-sort.helper";

export type MediaInteractionFlag = "liked" | "watchlisted";

const movieFlagFilter = (userId: string, flag: MediaInteractionFlag) =>
  and(
    eq(movieInteractions.userId, userId),
    flag === "liked" ? eq(movieInteractions.liked, true) : eq(movieInteractions.watchlisted, true),
  );

const serialFlagFilter = (userId: string, flag: MediaInteractionFlag) =>
  and(
    eq(serialInteractions.userId, userId),
    flag === "liked"
      ? eq(serialInteractions.liked, true)
      : eq(serialInteractions.watchlisted, true),
  );

// Must match compareShelfRows so the per-source caps line up with the merge.
const shelfOrderBy = (
  sort: ProfileShelfSort,
  yearColumn: AnyColumn,
  interactedAtColumn: AnyColumn,
): SQL[] => {
  if (sort === "oldest") return [asc(interactedAtColumn)];
  if (sort === "release") {
    return [sql`${yearColumn} desc nulls last`, desc(interactedAtColumn)];
  }
  return [desc(interactedAtColumn)];
};

export class UsersMediaInteractionsRepository {
  static async getWatchedMovies(userId: string, limit?: number, offset?: number) {
    const baseQuery = db
      .select({
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
        runtime: movies.runtime,
        genres: movies.genres,
        mediaType: sql<"movie">`'movie'`,
        lastInteractionAt: movieInteractions.updatedAt,
      })
      .from(movieInteractions)
      .innerJoin(movies, eq(movieInteractions.movieId, movies.id))
      .where(and(eq(movieInteractions.userId, userId), eq(movieInteractions.isWatched, true)))
      .orderBy(desc(movieInteractions.updatedAt))
      .$dynamic();

    return applyOptionalPagination(baseQuery, limit, offset);
  }

  static async getMediaByFlag(
    userId: string,
    flag: MediaInteractionFlag,
    options: { type: ProfileShelfType; sort: ProfileShelfSort; limit: number; offset: number },
  ) {
    // Each source is ordered the same way and capped at offset+limit, so the
    // merged slice is exact without pulling the whole collection.
    const fetchCap = options.limit + options.offset;
    const sort = options.sort;

    const movieQ = db
      .select({
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
        runtime: movies.runtime,
        genres: movies.genres,
        mediaType: sql<"movie">`'movie'`,
        lastInteractionAt: movieInteractions.updatedAt,
      })
      .from(movieInteractions)
      .innerJoin(movies, eq(movieInteractions.movieId, movies.id))
      .where(movieFlagFilter(userId, flag))
      .orderBy(...shelfOrderBy(sort, movies.releaseYear, movieInteractions.updatedAt))
      .limit(fetchCap);

    const serialQ = db
      .select({
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        releaseYear: tvSeries.firstAirYear,
        runtime: tvSeries.episodeRuntime,
        genres: tvSeries.genres,
        mediaType: sql<"tv">`'tv'`,
        lastInteractionAt: serialInteractions.updatedAt,
      })
      .from(serialInteractions)
      .innerJoin(tvSeries, eq(serialInteractions.seriesId, tvSeries.id))
      .where(serialFlagFilter(userId, flag))
      .orderBy(...shelfOrderBy(sort, tvSeries.firstAirYear, serialInteractions.updatedAt))
      .limit(fetchCap);

    const [movieRows, serialRows] = await Promise.all([
      options.type === "tv" ? [] : movieQ,
      options.type === "movie" ? [] : serialQ,
    ]);

    return [...movieRows, ...serialRows]
      .sort(compareShelfRows(sort))
      .slice(options.offset, options.offset + options.limit);
  }

  static async countMediaByFlag(
    userId: string,
    flag: MediaInteractionFlag,
  ): Promise<{ movie: number; tv: number }> {
    const [[movieCount], [serialCount]] = await Promise.all([
      db.select({ value: count() }).from(movieInteractions).where(movieFlagFilter(userId, flag)),
      db.select({ value: count() }).from(serialInteractions).where(serialFlagFilter(userId, flag)),
    ]);

    return { movie: movieCount?.value ?? 0, tv: serialCount?.value ?? 0 };
  }
}
