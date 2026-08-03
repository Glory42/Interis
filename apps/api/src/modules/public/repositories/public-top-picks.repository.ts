import { inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { movies } from "../../movies/movies.entity";
import { tvSeries } from "../../serials/serials.entity";
import { UsersTopPicksRepository } from "../../users/repositories/users-top-picks.repository";

export class PublicTopPicksRepository {
  static getTopPicksByUserId(userId: string) {
    return UsersTopPicksRepository.getTopPicksByUserId(userId);
  }

  static async getMoviesByTmdbIds(tmdbIds: number[]) {
    if (tmdbIds.length === 0) {
      return [];
    }

    return db
      .select({
        id: movies.id,
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
      })
      .from(movies)
      .where(inArray(movies.tmdbId, tmdbIds));
  }

  static async getSeriesByTmdbIds(tmdbIds: number[]) {
    if (tmdbIds.length === 0) {
      return [];
    }

    return db
      .select({
        id: tvSeries.id,
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        releaseYear: tvSeries.firstAirYear,
      })
      .from(tvSeries)
      .where(inArray(tvSeries.tmdbId, tmdbIds));
  }
}
