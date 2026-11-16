import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { reviews } from "../../reviews/reviews.entity";
import { seriesDiaryEntries, seriesInteractions, tvSeries } from "../../tv/tv.entity";
import type { DiaryReadOptions } from "../../diary/repositories/diary.repository";
import { DiaryTagsRepository } from "../../media/repositories/diary-tags.repository";

export class UsersDiaryRepository {
  static async findSeriesDiaryEntriesByUser(
    userId: string,
    fetchCap: number,
    { includeNote = false, tag }: DiaryReadOptions = {},
  ) {
    return db
      .select({
        id: seriesDiaryEntries.id,
        watchedDate: seriesDiaryEntries.watchedDate,
        rating: seriesDiaryEntries.rating,
        rewatch: seriesDiaryEntries.rewatch,
        note: includeNote ? seriesDiaryEntries.note : sql<string | null>`null`,
        createdAt: seriesDiaryEntries.createdAt,
        updatedAt: seriesDiaryEntries.updatedAt,
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        releaseYear: tvSeries.firstAirYear,
        reviewId: reviews.id,
        reviewContent: reviews.content,
        reviewContainsSpoilers: reviews.containsSpoilers,
        reviewCreatedAt: reviews.createdAt,
        liked: sql<boolean>`coalesce(${seriesInteractions.liked}, false)`,
      })
      .from(seriesDiaryEntries)
      .innerJoin(tvSeries, eq(tvSeries.id, seriesDiaryEntries.seriesId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.userId, seriesDiaryEntries.userId),
          eq(reviews.serialDiaryEntryId, seriesDiaryEntries.id),
          eq(reviews.mediaType, "tv"),
        ),
      )
      .leftJoin(
        seriesInteractions,
        and(
          eq(seriesInteractions.userId, seriesDiaryEntries.userId),
          eq(seriesInteractions.seriesId, seriesDiaryEntries.seriesId),
        ),
      )
      .where(
        and(
          eq(seriesDiaryEntries.userId, userId),
          tag === undefined
            ? undefined
            : inArray(seriesDiaryEntries.id, DiaryTagsRepository.taggedEntryIds(userId, "tv", tag)),
        ),
      )
      .orderBy(desc(seriesDiaryEntries.watchedDate), desc(seriesDiaryEntries.createdAt))
      .limit(fetchCap);
  }
}
