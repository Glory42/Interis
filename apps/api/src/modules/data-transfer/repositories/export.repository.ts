import { desc, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { reviews } from "../../reviews/reviews.entity";
import { serialDiaryEntries, tvSeries } from "../../serials/serials.entity";

export class ExportRepository {
  static async findAllSerialDiaryEntriesByUser(userId: string) {
    return db
      .select({
        id: serialDiaryEntries.id,
        watchedDate: serialDiaryEntries.watchedDate,
        rating: serialDiaryEntries.rating,
        rewatch: serialDiaryEntries.rewatch,
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        firstAirYear: tvSeries.firstAirYear,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
      })
      .from(serialDiaryEntries)
      .innerJoin(tvSeries, eq(tvSeries.id, serialDiaryEntries.seriesId))
      .leftJoin(reviews, eq(reviews.diaryEntryId, serialDiaryEntries.id))
      .where(eq(serialDiaryEntries.userId, userId))
      .orderBy(desc(serialDiaryEntries.watchedDate));
  }
}
