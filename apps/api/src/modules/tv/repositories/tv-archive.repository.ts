import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { seriesDiaryEntries, tvSeries } from "../tv.entity";
import { YourRatingRepository } from "../../media-interactions/repositories/your-rating.repository";

export class TvArchiveRepository {
  static async getLocalArchiveAggregateRowsByTmdbIds(tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    const communityRating = YourRatingRepository.communityAggregateSql("tv", tvSeries.id);

    return db
      .select({
        tmdbId: tvSeries.tmdbId,
        firstAirDate: tvSeries.firstAirDate,
        firstAirYear: tvSeries.firstAirYear,
        creator: tvSeries.creator,
        network: tvSeries.network,
        languageCode: tvSeries.languageCode,
        genres: tvSeries.genres,
        numberOfEpisodes: tvSeries.numberOfEpisodes,
        logCount: sql<number>`count(${seriesDiaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen: communityRating.avgRatingOutOfTen.as("avgRatingOutOfTen"),
        ratedLogCount: communityRating.ratedLogCount.as("ratedLogCount"),
      })
      .from(tvSeries)
      .leftJoin(seriesDiaryEntries, eq(seriesDiaryEntries.seriesId, tvSeries.id))
      .where(inArray(tvSeries.tmdbId, uniqueTmdbIds))
      .groupBy(tvSeries.id);
  }

  static async getLocalArchiveRows() {
    const communityRating = YourRatingRepository.communityAggregateSql("tv", tvSeries.id);

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
        numberOfEpisodes: tvSeries.numberOfEpisodes,
        logCount: sql<number>`count(${seriesDiaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen: communityRating.avgRatingOutOfTen.as("avgRatingOutOfTen"),
        ratedLogCount: communityRating.ratedLogCount.as("ratedLogCount"),
      })
      .from(tvSeries)
      .leftJoin(seriesDiaryEntries, eq(seriesDiaryEntries.seriesId, tvSeries.id))
      .groupBy(tvSeries.id)
      .orderBy(asc(tvSeries.title));
  }

}
