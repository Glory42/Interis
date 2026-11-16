import { DiaryRepository } from "../../diary/repositories/diary.repository";
import { DiaryTagsService } from "../../media/services/diary-tags.service";
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
  "Note",
  "Tags",
] as const;

// Tags are joined with ", " like Letterboxd's Tags column; a tag never contains a comma.
export const EXPORT_TAG_SEPARATOR = ", ";

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
  note: string | null;
  tags: string[];
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
  Note: entry.note ?? "",
  Tags: entry.tags.join(EXPORT_TAG_SEPARATOR),
});

export class DataExportService {
  static async exportDiary(userId: string): Promise<string> {
    const [movieEntries, serialEntries, tagsOf] = await Promise.all([
      DiaryRepository.findAllByUser(userId, undefined, undefined, { includeNote: true }),
      ExportRepository.findAllSerialDiaryEntriesByUser(userId),
      DiaryTagsService.lookupForUser(userId),
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
        note: entry.note,
        tags: tagsOf("movie", entry.id),
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
        note: entry.note,
        tags: tagsOf("tv", entry.id),
      }),
    );

    const combined = [...movieRows, ...serialRows].sort((a, b) =>
      b.WatchedDate.localeCompare(a.WatchedDate),
    );

    return buildCsv([...EXPORT_HEADERS], combined);
  }
}
