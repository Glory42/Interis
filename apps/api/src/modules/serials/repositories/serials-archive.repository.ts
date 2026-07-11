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
        numberOfEpisodes: tvSeries.numberOfEpisodes,
        logCount: sql<number>`count(${serialDiaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen: sql<number | null>`(
          select avg(r.rating)::double precision from (
            select rating from serial_diary_entry where series_id = ${tvSeries.id} and rating is not null
            union all
            select si.rating from serial_interaction si
            where si.series_id = ${tvSeries.id} and si.rating is not null
              and not exists (
                select 1 from serial_diary_entry sde2 where sde2.series_id = ${tvSeries.id} and sde2.user_id = si.user_id
              )
          ) r
        )`.as("avgRatingOutOfTen"),
        ratedLogCount: sql<number>`(
          select count(*)::int from (
            select rating from serial_diary_entry where series_id = ${tvSeries.id} and rating is not null
            union all
            select si.rating from serial_interaction si
            where si.series_id = ${tvSeries.id} and si.rating is not null
              and not exists (
                select 1 from serial_diary_entry sde2 where sde2.series_id = ${tvSeries.id} and sde2.user_id = si.user_id
              )
          ) r
        )`.as("ratedLogCount"),
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
        numberOfEpisodes: tvSeries.numberOfEpisodes,
        logCount: sql<number>`count(${serialDiaryEntries.id})::int`.as("logCount"),
        avgRatingOutOfTen: sql<number | null>`(
          select avg(r.rating)::double precision from (
            select rating from serial_diary_entry where series_id = ${tvSeries.id} and rating is not null
            union all
            select si.rating from serial_interaction si
            where si.series_id = ${tvSeries.id} and si.rating is not null
              and not exists (
                select 1 from serial_diary_entry sde2 where sde2.series_id = ${tvSeries.id} and sde2.user_id = si.user_id
              )
          ) r
        )`.as("avgRatingOutOfTen"),
        ratedLogCount: sql<number>`(
          select count(*)::int from (
            select rating from serial_diary_entry where series_id = ${tvSeries.id} and rating is not null
            union all
            select si.rating from serial_interaction si
            where si.series_id = ${tvSeries.id} and si.rating is not null
              and not exists (
                select 1 from serial_diary_entry sde2 where sde2.series_id = ${tvSeries.id} and sde2.user_id = si.user_id
              )
          ) r
        )`.as("ratedLogCount"),
      })
      .from(tvSeries)
      .leftJoin(serialDiaryEntries, eq(serialDiaryEntries.seriesId, tvSeries.id))
      .groupBy(tvSeries.id)
      .orderBy(asc(tvSeries.title));
  }

}
