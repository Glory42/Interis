import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { serialDiaryEntries, tvSeries } from "../serials.entity";

export class SerialsArchiveRepository {
  static async getLocalArchiveAggregateRowsByTmdbIds(tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    return db
      .select({
        tmdbId: tvSeries.tmdbId,
        firstAirDate: tvSeries.firstAirDate,
        firstAirYear: tvSeries.firstAirYear,
        creator: tvSeries.creator,
        network: tvSeries.network,
        languageCode: tvSeries.languageCode,
        genres: tvSeries.genres,
        logCount: sql<number>`count(${serialDiaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen:
          sql<number | null>`avg(${serialDiaryEntries.rating})::double precision`.as(
            "avgRatingOutOfTen",
          ),
        ratedLogCount:
          sql<number>`count(${serialDiaryEntries.rating})::int`.as("ratedLogCount"),
      })
      .from(tvSeries)
      .leftJoin(serialDiaryEntries, eq(serialDiaryEntries.seriesId, tvSeries.id))
      .where(inArray(tvSeries.tmdbId, uniqueTmdbIds))
      .groupBy(tvSeries.id);
  }

  static async getLocalArchiveRows() {
    return db
      .select({
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        backdropPath: tvSeries.backdropPath,
        firstAirDate: tvSeries.firstAirDate,
        firstAirYear: tvSeries.firstAirYear,
        creator: tvSeries.creator,
        network: tvSeries.network,
        languageCode: tvSeries.languageCode,
        genres: tvSeries.genres,
        logCount: sql<number>`count(${serialDiaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen:
          sql<number | null>`avg(${serialDiaryEntries.rating})::double precision`.as(
            "avgRatingOutOfTen",
          ),
        ratedLogCount:
          sql<number>`count(${serialDiaryEntries.rating})::int`.as("ratedLogCount"),
      })
      .from(tvSeries)
      .leftJoin(serialDiaryEntries, eq(serialDiaryEntries.seriesId, tvSeries.id))
      .groupBy(tvSeries.id)
      .orderBy(asc(tvSeries.title));
  }

  static async getCachedArchiveRows() {
    return SerialsArchiveRepository.getLocalArchiveRows();
  }
}
