import { desc, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { reviews } from "../../reviews/reviews.entity";
import { seriesDiaryEntries, tvSeries } from "../../tv/tv.entity";

export class ExportRepository {
  static async findAllSerialDiaryEntriesByUser(userId: string) {
    return db
      .select({
        id: seriesDiaryEntries.id,
        watchedDate: seriesDiaryEntries.watchedDate,
        rating: seriesDiaryEntries.rating,
        rewatch: seriesDiaryEntries.rewatch,
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        firstAirYear: tvSeries.firstAirYear,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
      })
      .from(seriesDiaryEntries)
      .innerJoin(tvSeries, eq(tvSeries.id, seriesDiaryEntries.seriesId))
      .leftJoin(reviews, eq(reviews.diaryEntryId, seriesDiaryEntries.id))
      .where(eq(seriesDiaryEntries.userId, userId))
      .orderBy(desc(seriesDiaryEntries.watchedDate));
  }
}
