import { eq, desc } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { DiaryRepository } from "../../diary/repositories/diary.repository";
import { reviews } from "../../reviews/reviews.entity";
import { serialDiaryEntries, tvSeries } from "../../serials/serials.entity";
import { buildCsv } from "../helpers/csv-builder";

export const EXPORT_HEADERS = [
  "WatchedDate",
  "MediaType",
  "Title",
  "Year",
  "TmdbId",
  "Rating",
  "Rewatch",
  "Review",
  "Spoilers",
] as const;

export class DataExportService {
  static async exportDiary(userId: string): Promise<string> {
    const [movieEntries, serialEntries] = await Promise.all([
      DiaryRepository.findAllByUser(userId),
      db
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
        .leftJoin(
          reviews,
          eq(reviews.diaryEntryId, serialDiaryEntries.id),
        )
        .where(eq(serialDiaryEntries.userId, userId))
        .orderBy(desc(serialDiaryEntries.watchedDate)),
    ]);

    type Row = Record<(typeof EXPORT_HEADERS)[number], string>;

    const movieRows: Row[] = movieEntries.map((entry) => ({
      WatchedDate: entry.watchedDate,
      MediaType: "movie",
      Title: entry.movieTitle,
      Year: String(entry.movieReleaseYear ?? ""),
      TmdbId: String(entry.movieTmdbId),
      Rating: entry.rating !== null ? String(entry.rating / 2) : "",
      Rewatch: entry.rewatch ? "true" : "false",
      Review: entry.reviewContent ?? "",
      Spoilers: entry.reviewContent
        ? entry.reviewContainsSpoilers
          ? "true"
          : "false"
        : "",
    }));

    const serialRows: Row[] = serialEntries.map((entry) => ({
      WatchedDate: entry.watchedDate,
      MediaType: "tv",
      Title: entry.title,
      Year: String(entry.firstAirYear ?? ""),
      TmdbId: String(entry.tmdbId),
      Rating: entry.rating !== null ? String(entry.rating / 2) : "",
      Rewatch: entry.rewatch ? "true" : "false",
      Review: entry.reviewContent ?? "",
      Spoilers: entry.reviewContent
        ? entry.reviewContainsSpoilers
          ? "true"
          : "false"
        : "",
    }));

    const combined = [...movieRows, ...serialRows].sort((a, b) =>
      b.WatchedDate.localeCompare(a.WatchedDate),
    );

    return buildCsv([...EXPORT_HEADERS], combined);
  }
}
