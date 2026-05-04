import { searchMovieByTitleAndYear } from "../../../infrastructure/tmdb/cinemas";
import { MoviesService } from "../../movies/movies.service";
import { DiaryRepository } from "../../diary/repositories/diary.repository";
import { parseCsv, getCsvHeaders } from "../helpers/csv-parser";

export type ImportStreamEvent =
  | { type: "start"; total: number; format: string }
  | { type: "row"; title: string; year: number | null; status: "imported" | "skipped" | "failed"; reason?: string }
  | { type: "done"; total: number; imported: number; skipped: number; failed: number };

type ImportFormat = "letterboxd" | "letterboxd-watched" | "interis" | "unknown";

const FORMAT_LABELS: Record<ImportFormat, string> = {
  letterboxd: "Letterboxd diary",
  "letterboxd-watched": "Letterboxd watched",
  interis: "Interis export",
  unknown: "unknown",
};

function detectFormat(headers: string[]): ImportFormat {
  const set = new Set(headers);
  if (set.has("TmdbId") && set.has("WatchedDate")) return "interis";
  if (set.has("Name") && set.has("Watched Date")) return "letterboxd";
  if (set.has("Name") && set.has("Date") && set.has("Year")) return "letterboxd-watched";
  return "unknown";
}

function parseRating(raw: string): number | null {
  const n = Number.parseFloat(raw);
  if (Number.isNaN(n) || n <= 0) return null;
  const clamped = Math.min(5, Math.max(0.5, n));
  return Math.round(clamped * 2) / 2;
}

function toRatingOutOfTen(ratingOutOfFive: number | null): number | null {
  if (ratingOutOfFive === null) return null;
  return Math.round(ratingOutOfFive * 2);
}

function parseDate(raw: string): string | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return null;
  return raw.trim();
}

function parseRewatch(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === "yes" || v === "true";
}

type NormalizedRow = {
  title: string;
  year: number | null;
  tmdbId: number | null;
  watchedDate: string;
  rating: number | null;
  rewatch: boolean;
  review: string;
  spoilers: boolean;
};

function normalizeLetterboxdRow(row: Record<string, string>): NormalizedRow | null {
  const watchedDate =
    parseDate(row["Watched Date"] ?? "") ?? parseDate(row["Date"] ?? "");
  if (!watchedDate) return null;

  const title = (row["Name"] ?? "").trim();
  if (!title) return null;

  const yearRaw = Number.parseInt(row["Year"] ?? "", 10);
  const year = Number.isNaN(yearRaw) ? null : yearRaw;

  return {
    title,
    year,
    tmdbId: null,
    watchedDate,
    rating: parseRating(row["Rating"] ?? ""),
    rewatch: parseRewatch(row["Rewatch"] ?? ""),
    review: (row["Review"] ?? "").trim(),
    spoilers: false,
  };
}

function normalizeLetterboxdWatchedRow(row: Record<string, string>): NormalizedRow | null {
  const watchedDate = parseDate(row["Date"] ?? "");
  if (!watchedDate) return null;

  const title = (row["Name"] ?? "").trim();
  if (!title) return null;

  const yearRaw = Number.parseInt(row["Year"] ?? "", 10);
  const year = Number.isNaN(yearRaw) ? null : yearRaw;

  return {
    title,
    year,
    tmdbId: null,
    watchedDate,
    rating: null,
    rewatch: false,
    review: "",
    spoilers: false,
  };
}

function normalizeInterisRow(row: Record<string, string>): NormalizedRow | null {
  const watchedDate = parseDate(row["WatchedDate"] ?? "");
  if (!watchedDate) return null;

  const title = (row["Title"] ?? "").trim();
  if (!title) return null;

  const tmdbIdRaw = Number.parseInt(row["TmdbId"] ?? "", 10);
  const tmdbId = Number.isNaN(tmdbIdRaw) ? null : tmdbIdRaw;

  const yearRaw = Number.parseInt(row["Year"] ?? "", 10);
  const year = Number.isNaN(yearRaw) ? null : yearRaw;

  return {
    title,
    year,
    tmdbId,
    watchedDate,
    rating: parseRating(row["Rating"] ?? ""),
    rewatch: parseRewatch(row["Rewatch"] ?? ""),
    review: (row["Review"] ?? "").trim(),
    spoilers: (row["Spoilers"] ?? "").trim().toLowerCase() === "true",
  };
}

async function resolveTmdbId(row: NormalizedRow): Promise<number | null> {
  if (row.tmdbId) return row.tmdbId;
  const results = await searchMovieByTitleAndYear(row.title, row.year ?? 0);
  return results[0]?.id ?? null;
}

export class DataImportService {
  static async importCsvStreaming(
    userId: string,
    csvText: string,
    write: (event: ImportStreamEvent) => void,
  ): Promise<void> {
    const headers = getCsvHeaders(csvText);
    const format = detectFormat(headers);

    if (format === "unknown") {
      write({ type: "row", title: "", year: null, status: "failed", reason: "Unrecognized CSV format. Expected Letterboxd diary.csv, reviews.csv, watched.csv, or an Interis export." });
      write({ type: "done", total: 0, imported: 0, skipped: 0, failed: 1 });
      return;
    }

    const rawRows = parseCsv(csvText);
    write({ type: "start", total: rawRows.length, format: FORMAT_LABELS[format] });

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const rawRow = rawRows[i];
      if (!rawRow) continue;

      const normalized =
        format === "letterboxd"
          ? normalizeLetterboxdRow(rawRow)
          : format === "letterboxd-watched"
            ? normalizeLetterboxdWatchedRow(rawRow)
            : normalizeInterisRow(rawRow);

      const displayTitle = (rawRow["Name"] ?? rawRow["Title"] ?? "").trim();
      const displayYear = Number.parseInt(rawRow["Year"] ?? "", 10);
      const year = Number.isNaN(displayYear) ? null : displayYear;

      if (!normalized) {
        failed++;
        write({ type: "row", title: displayTitle, year, status: "failed", reason: "Missing required fields." });
        continue;
      }

      let tmdbId: number | null;
      try {
        tmdbId = await resolveTmdbId(normalized);
      } catch {
        failed++;
        write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "TMDB search failed." });
        continue;
      }

      if (!tmdbId) {
        failed++;
        write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "Not found on TMDB." });
        continue;
      }

      let movie: { id: number; tmdbId: number } | null;
      try {
        movie = await MoviesService.findOrCreate(tmdbId);
      } catch {
        failed++;
        write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "Failed to fetch movie details." });
        continue;
      }

      if (!movie) {
        failed++;
        write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "Not found on TMDB." });
        continue;
      }

      const alreadyExists =
        format === "letterboxd-watched"
          ? await DiaryRepository.existsByUserAndMovie(userId, movie.id)
          : await DiaryRepository.existsByUserMovieAndDate(userId, movie.id, normalized.watchedDate);

      if (alreadyExists) {
        skipped++;
        write({ type: "row", title: normalized.title, year: normalized.year, status: "skipped", reason: "Already in diary." });
        continue;
      }

      let entry: { id: string } | null;
      try {
        entry = await DiaryRepository.insertEntry({
          userId,
          movieId: movie.id,
          watchedDate: normalized.watchedDate,
          rating: toRatingOutOfTen(normalized.rating),
          rewatch: normalized.rewatch,
        });
      } catch {
        failed++;
        write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "Failed to save entry." });
        continue;
      }

      if (!entry) {
        failed++;
        write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "Failed to save entry." });
        continue;
      }

      if (normalized.review && entry) {
        try {
          await DiaryRepository.upsertReview({
            userId,
            movieId: movie.id,
            movieTmdbId: movie.tmdbId,
            diaryEntryId: entry.id,
            content: normalized.review,
            containsSpoilers: normalized.spoilers,
          });
        } catch {
          // Review failure is non-fatal — diary entry is saved
        }
      }

      imported++;
      write({ type: "row", title: normalized.title, year: normalized.year, status: "imported" });
    }

    write({ type: "done", total: rawRows.length, imported, skipped, failed });
  }
}
