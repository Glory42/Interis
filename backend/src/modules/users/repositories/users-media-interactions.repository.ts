import { and, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { movieInteractions } from "../../interactions/interactions.entity";
import { movies } from "../../movies/movies.entity";
import { serialInteractions, tvSeries } from "../../serials/serials.entity";

export class UsersMediaInteractionsRepository {
  static async getLikedFilms(userId: string) {
    const [movieRows, serialRows] = await Promise.all([
      db
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
        .where(and(eq(movieInteractions.userId, userId), eq(movieInteractions.liked, true))),
      db
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
        .where(and(eq(serialInteractions.userId, userId), eq(serialInteractions.liked, true))),
    ]);

    return [...movieRows, ...serialRows].sort(
      (left, right) => right.lastInteractionAt.getTime() - left.lastInteractionAt.getTime(),
    );
  }

  static async getWatchlistedFilms(userId: string) {
    const [movieRows, serialRows] = await Promise.all([
      db
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
            eq(movieInteractions.watchlisted, true),
          ),
        ),
      db
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
            eq(serialInteractions.watchlisted, true),
          ),
        ),
    ]);

    return [...movieRows, ...serialRows].sort(
      (left, right) => right.lastInteractionAt.getTime() - left.lastInteractionAt.getTime(),
    );
  }
}
