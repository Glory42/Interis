import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { movieInteractions } from "../../interactions/interactions.entity";
import { movies } from "../../movies/movies.entity";
import {
  serialEpisodeInteractions,
  serialInteractions,
  tvSeries,
} from "../../serials/serials.entity";

export class ViewerStatusRepository {
  static async findMovieStatuses(userId: string, tmdbIds: number[]) {
    return db
      .select({
        tmdbId: movies.tmdbId,
        watched: movieInteractions.isWatched,
        rating: movieInteractions.rating,
        liked: movieInteractions.liked,
        watchlisted: movieInteractions.watchlisted,
      })
      .from(movieInteractions)
      .innerJoin(movies, eq(movies.id, movieInteractions.movieId))
      .where(and(eq(movieInteractions.userId, userId), inArray(movies.tmdbId, tmdbIds)));
  }

  // Left join so a cached series still reports its episode total with no interaction row.
  static async findSeriesStatuses(userId: string, tmdbIds: number[]) {
    return db
      .select({
        tmdbId: tvSeries.tmdbId,
        totalEpisodes: tvSeries.numberOfEpisodes,
        watchStatus: serialInteractions.watchStatus,
        rating: serialInteractions.rating,
        liked: serialInteractions.liked,
        watchlisted: serialInteractions.watchlisted,
      })
      .from(tvSeries)
      .leftJoin(
        serialInteractions,
        and(eq(serialInteractions.seriesId, tvSeries.id), eq(serialInteractions.userId, userId)),
      )
      .where(inArray(tvSeries.tmdbId, tmdbIds));
  }

  static async countWatchedEpisodes(userId: string, tmdbIds: number[]) {
    return db
      .select({ tmdbId: tvSeries.tmdbId, watched: count() })
      .from(serialEpisodeInteractions)
      .innerJoin(tvSeries, eq(tvSeries.id, serialEpisodeInteractions.seriesId))
      .where(
        and(
          eq(serialEpisodeInteractions.userId, userId),
          eq(serialEpisodeInteractions.watched, true),
          inArray(tvSeries.tmdbId, tmdbIds),
        ),
      )
      .groupBy(tvSeries.tmdbId);
  }
}
