import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { applyOptionalPagination } from "../../../commons/helpers/db-pagination.helper";
import { mergeSortedPaginated } from "../../../commons/helpers/merge-sorted-paginated.helper";
import { movieInteractions } from "../../interactions/interactions.entity";
import { movies } from "../../movies/movies.entity";
import { serialInteractions, tvSeries } from "../../serials/serials.entity";

export type MediaInteractionFlag = "liked" | "watchlisted";

export class UsersMediaInteractionsRepository {
  static async getWatchedFilms(userId: string, limit?: number, offset?: number) {
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

  static async getFilmsByFlag(
    userId: string,
    flag: MediaInteractionFlag,
    limit?: number,
    offset?: number,
  ) {
    // Fetch enough of each source to cover through offset+limit, then merge,
    // sort, and slice the exact page - avoids ever pulling the whole
    // collection just to paginate it.
    const fetchCap = limit ? limit + (offset ?? 0) : undefined;

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
      .where(
        and(
          eq(movieInteractions.userId, userId),
          flag === "liked"
            ? eq(movieInteractions.liked, true)
            : eq(movieInteractions.watchlisted, true),
        ),
      );

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
      .where(
        and(
          eq(serialInteractions.userId, userId),
          flag === "liked"
            ? eq(serialInteractions.liked, true)
            : eq(serialInteractions.watchlisted, true),
        ),
      );

    const [movieRows, serialRows] = await Promise.all([
      fetchCap ? movieQ.limit(fetchCap) : movieQ,
      fetchCap ? serialQ.limit(fetchCap) : serialQ,
    ]);

    return mergeSortedPaginated(
      [...movieRows, ...serialRows],
      limit,
      offset,
      (row) => row.lastInteractionAt.getTime(),
    );
  }
}
