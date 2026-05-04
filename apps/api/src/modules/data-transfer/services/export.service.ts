import { DiaryRepository } from "../../diary/repositories/diary.repository";
import { buildCsv } from "../helpers/csv-builder";

export const EXPORT_HEADERS = [
  "WatchedDate",
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
    const entries = await DiaryRepository.findAllByUser(userId);

    const rows = entries.map((entry) => ({
      WatchedDate: entry.watchedDate,
      Title: entry.movieTitle,
      Year: String(entry.movieReleaseYear ?? ""),
      TmdbId: String(entry.movieTmdbId),
      Rating: entry.rating !== null ? String(entry.rating / 2) : "",
      Rewatch: entry.rewatch ? "true" : "false",
      Review: entry.reviewContent ?? "",
      Spoilers:
        entry.reviewContent
          ? entry.reviewContainsSpoilers
            ? "true"
            : "false"
          : "",
    }));

    return buildCsv([...EXPORT_HEADERS], rows);
  }
}
