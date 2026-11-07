import { and, asc, count, desc, eq, sql, type AnyColumn, type SQL } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { applyOptionalPagination } from "../../../commons/helpers/db-pagination.helper";
import { filmInteractions } from "../../interactions/interactions.entity";
import { films } from "../../films/films.entity";
import { seriesInteractions, tvSeries } from "../../tv/tv.entity";

import type { ProfileShelfSort, ProfileShelfType } from "../dto/users.dto";
import { compareShelfRows } from "../helpers/users-shelf-sort.helper";

export type MediaInteractionFlag = "liked" | "watchlisted";

const filmFlagFilter = (userId: string, flag: MediaInteractionFlag) =>
  and(
    eq(filmInteractions.userId, userId),
    flag === "liked" ? eq(filmInteractions.liked, true) : eq(filmInteractions.watchlisted, true),
  );

const seriesFlagFilter = (userId: string, flag: MediaInteractionFlag) =>
  and(
    eq(seriesInteractions.userId, userId),
    flag === "liked"
      ? eq(seriesInteractions.liked, true)
      : eq(seriesInteractions.watchlisted, true),
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
        tmdbId: films.tmdbId,
        title: films.title,
        posterPath: films.posterPath,
        releaseYear: films.releaseYear,
        runtime: films.runtime,
        genres: films.genres,
        mediaType: sql<"movie">`'movie'`,
        lastInteractionAt: filmInteractions.updatedAt,
      })
      .from(filmInteractions)
      .innerJoin(films, eq(filmInteractions.movieId, films.id))
      .where(and(eq(filmInteractions.userId, userId), eq(filmInteractions.isWatched, true)))
      .orderBy(desc(filmInteractions.updatedAt))
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
        tmdbId: films.tmdbId,
        title: films.title,
        posterPath: films.posterPath,
        releaseYear: films.releaseYear,
        runtime: films.runtime,
        genres: films.genres,
        mediaType: sql<"movie">`'movie'`,
        lastInteractionAt: filmInteractions.updatedAt,
      })
      .from(filmInteractions)
      .innerJoin(films, eq(filmInteractions.movieId, films.id))
      .where(filmFlagFilter(userId, flag))
      .orderBy(...shelfOrderBy(sort, films.releaseYear, filmInteractions.updatedAt))
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
        lastInteractionAt: seriesInteractions.updatedAt,
      })
      .from(seriesInteractions)
      .innerJoin(tvSeries, eq(seriesInteractions.seriesId, tvSeries.id))
      .where(seriesFlagFilter(userId, flag))
      .orderBy(...shelfOrderBy(sort, tvSeries.firstAirYear, seriesInteractions.updatedAt))
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
      db.select({ value: count() }).from(filmInteractions).where(filmFlagFilter(userId, flag)),
      db.select({ value: count() }).from(seriesInteractions).where(seriesFlagFilter(userId, flag)),
    ]);

    return { movie: movieCount?.value ?? 0, tv: serialCount?.value ?? 0 };
  }
}
