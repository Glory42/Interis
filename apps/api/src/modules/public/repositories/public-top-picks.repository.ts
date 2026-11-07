import { inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { films } from "../../films/films.entity";
import { tvSeries } from "../../tv/tv.entity";
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
        id: films.id,
        tmdbId: films.tmdbId,
        title: films.title,
        posterPath: films.posterPath,
        releaseYear: films.releaseYear,
      })
      .from(films)
      .where(inArray(films.tmdbId, tmdbIds));
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
