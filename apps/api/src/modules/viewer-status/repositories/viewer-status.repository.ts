import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { filmInteractions } from "../../interactions/interactions.entity";
import { films } from "../../films/films.entity";
import {
  seriesEpisodeInteractions,
  seriesInteractions,
  tvSeries,
} from "../../tv/tv.entity";
import { YourRatingRepository } from "../../media-interactions/repositories/your-rating.repository";

export class ViewerStatusRepository {
  static async findMovieStatuses(userId: string, tmdbIds: number[]) {
    return db
      .select({
        tmdbId: films.tmdbId,
        watched: filmInteractions.isWatched,
        rating: YourRatingRepository.resolveSql("movie", userId, films.id),
        liked: filmInteractions.liked,
        watchlisted: filmInteractions.watchlisted,
      })
      .from(filmInteractions)
      .innerJoin(films, eq(films.id, filmInteractions.movieId))
      .where(and(eq(filmInteractions.userId, userId), inArray(films.tmdbId, tmdbIds)));
  }

  // Left join so a cached series still reports its episode total with no interaction row.
  static async findSeriesStatuses(userId: string, tmdbIds: number[]) {
    return db
      .select({
        tmdbId: tvSeries.tmdbId,
        totalEpisodes: tvSeries.numberOfEpisodes,
        watchStatus: seriesInteractions.watchStatus,
        rating: YourRatingRepository.resolveSql("tv", userId, tvSeries.id),
        liked: seriesInteractions.liked,
        watchlisted: seriesInteractions.watchlisted,
      })
      .from(tvSeries)
      .leftJoin(
        seriesInteractions,
        and(eq(seriesInteractions.seriesId, tvSeries.id), eq(seriesInteractions.userId, userId)),
      )
      .where(inArray(tvSeries.tmdbId, tmdbIds));
  }

  static async countWatchedEpisodes(userId: string, tmdbIds: number[]) {
    return db
      .select({ tmdbId: tvSeries.tmdbId, watched: count() })
      .from(seriesEpisodeInteractions)
      .innerJoin(tvSeries, eq(tvSeries.id, seriesEpisodeInteractions.seriesId))
      .where(
        and(
          eq(seriesEpisodeInteractions.userId, userId),
          eq(seriesEpisodeInteractions.watched, true),
          inArray(tvSeries.tmdbId, tmdbIds),
        ),
      )
      .groupBy(tvSeries.tmdbId);
  }
}
