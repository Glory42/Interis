import { DiaryRepository } from "../../diary/repositories/diary.repository";
import { buildCsv } from "../helpers/csv-builder";
import { ExportRepository } from "../repositories/export.repository";

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

const toExportRatingString = (r: number | null): string =>
  r !== null ? String(r / 2) : "";

export class DataExportService {
  static async exportDiary(userId: string): Promise<string> {
    const [movieEntries, serialEntries] = await Promise.all([
      DiaryRepository.findAllByUser(userId),
      ExportRepository.findAllSerialDiaryEntriesByUser(userId),
    ]);

    type Row = Record<(typeof EXPORT_HEADERS)[number], string>;

    const movieRows: Row[] = movieEntries.map((entry) => ({
      WatchedDate: entry.watchedDate,
      MediaType: "movie",
      Title: entry.movieTitle,
      Year: String(entry.movieReleaseYear ?? ""),
      TmdbId: String(entry.movieTmdbId),
      Rating: toExportRatingString(entry.rating),
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
      Rating: toExportRatingString(entry.rating),
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
