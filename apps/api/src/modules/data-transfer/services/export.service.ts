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

type Row = Record<(typeof EXPORT_HEADERS)[number], string>;

type DiaryEntryLike = {
  watchedDate: string;
  mediaType: "movie" | "tv";
  title: string;
  year: number | null;
  tmdbId: number;
  rating: number | null;
  rewatch: boolean;
  reviewContent: string | null;
  reviewContainsSpoilers: boolean | null;
};

// Movies and series diary entries come back from two differently-shaped
// repository queries (movieTitle vs title, movieReleaseYear vs
// firstAirYear, ...) - each gets normalized to DiaryEntryLike first so the
// actual CSV row shaping below is written once for both.
const toExportRow = (entry: DiaryEntryLike): Row => ({
  WatchedDate: entry.watchedDate,
  MediaType: entry.mediaType,
  Title: entry.title,
  Year: String(entry.year ?? ""),
  TmdbId: String(entry.tmdbId),
  Rating: toExportRatingString(entry.rating),
  Rewatch: entry.rewatch ? "true" : "false",
  Review: entry.reviewContent ?? "",
  Spoilers: entry.reviewContent ? (entry.reviewContainsSpoilers ? "true" : "false") : "",
});

export class DataExportService {
  static async exportDiary(userId: string): Promise<string> {
    const [movieEntries, serialEntries] = await Promise.all([
      DiaryRepository.findAllByUser(userId),
      ExportRepository.findAllSerialDiaryEntriesByUser(userId),
    ]);

    const movieRows = movieEntries.map((entry) =>
      toExportRow({
        watchedDate: entry.watchedDate,
        mediaType: "movie",
        title: entry.movieTitle,
        year: entry.movieReleaseYear,
        tmdbId: entry.movieTmdbId,
        rating: entry.rating,
        rewatch: entry.rewatch,
        reviewContent: entry.reviewContent,
        reviewContainsSpoilers: entry.reviewContainsSpoilers,
      }),
    );

    const serialRows = serialEntries.map((entry) =>
      toExportRow({
        watchedDate: entry.watchedDate,
        mediaType: "tv",
        title: entry.title,
        year: entry.firstAirYear,
        tmdbId: entry.tmdbId,
        rating: entry.rating,
        rewatch: entry.rewatch,
        reviewContent: entry.reviewContent,
        reviewContainsSpoilers: entry.reviewContainsSpoilers,
      }),
    );

    const combined = [...movieRows, ...serialRows].sort((a, b) =>
      b.WatchedDate.localeCompare(a.WatchedDate),
    );

    return buildCsv([...EXPORT_HEADERS], combined);
  }
}
