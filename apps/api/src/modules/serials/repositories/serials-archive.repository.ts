import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { serialDiaryEntries, serialInteractions, tvSeries } from "../serials.entity";
import {
  buildCommunityRatingAggregateSql,
  type CommunityRatingAggregateSource,
} from "../../media/helpers/media-community-rating.helper";

const SERIAL_COMMUNITY_RATING_SOURCE: CommunityRatingAggregateSource = {
  diaryTableName: "serial_diary_entry",
  diaryEntityIdColumn: serialDiaryEntries.seriesId,
  diaryRatingColumn: serialDiaryEntries.rating,
  diaryUserIdColumn: serialDiaryEntries.userId,
  interactionTableName: "serial_interaction",
  interactionEntityIdColumn: serialInteractions.seriesId,
  interactionRatingColumn: serialInteractions.rating,
  interactionUserIdColumn: serialInteractions.userId,
};

export class SerialsArchiveRepository {
  static async getLocalArchiveAggregateRowsByTmdbIds(tmdbIds: number[]) {
    const uniqueTmdbIds = [...new Set(tmdbIds)];
    if (uniqueTmdbIds.length === 0) {
      return [];
    }

    const communityRating = buildCommunityRatingAggregateSql(
      SERIAL_COMMUNITY_RATING_SOURCE,
      tvSeries.id,
    );

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
        logCount: sql<number>`count(${serialDiaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen: communityRating.avgRatingOutOfTen.as("avgRatingOutOfTen"),
        ratedLogCount: communityRating.ratedLogCount.as("ratedLogCount"),
      })
      .from(tvSeries)
      .leftJoin(serialDiaryEntries, eq(serialDiaryEntries.seriesId, tvSeries.id))
      .where(inArray(tvSeries.tmdbId, uniqueTmdbIds))
      .groupBy(tvSeries.id);
  }

  static async getLocalArchiveRows() {
    const communityRating = buildCommunityRatingAggregateSql(
      SERIAL_COMMUNITY_RATING_SOURCE,
      tvSeries.id,
    );

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
        logCount: sql<number>`count(${serialDiaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen: communityRating.avgRatingOutOfTen.as("avgRatingOutOfTen"),
        ratedLogCount: communityRating.ratedLogCount.as("ratedLogCount"),
      })
      .from(tvSeries)
      .leftJoin(serialDiaryEntries, eq(serialDiaryEntries.seriesId, tvSeries.id))
      .groupBy(tvSeries.id)
      .orderBy(asc(tvSeries.title));
  }

}
