import { searchMovieByTitleAndYear } from "../../../infrastructure/tmdb/cinemas";
import { searchSeriesByTitleAndYear } from "../../../infrastructure/tmdb/serials";
import { MoviesService } from "../../movies/movies.service";
import { SerialsService } from "../../serials/serials.service";
import { DiaryRepository } from "../../diary/repositories/diary.repository";
import { SerialsInteractionsRepository } from "../../serials/repositories/serials-interactions.repository";
import { InteractionsService } from "../../interactions/interactions.service";
import { parseCsv, getCsvHeaders } from "../helpers/csv-parser";

export type ImportStreamEvent =
  | { type: "start"; total: number; format: string }
  | { type: "row"; title: string; year: number | null; status: "imported" | "skipped" | "failed"; reason?: string }
  | { type: "done"; total: number; imported: number; skipped: number; failed: number };

type ImportFormat = "letterboxd" | "letterboxd-watched" | "letterboxd-watchlist" | "letterboxd-ratings" | "interis" | "unknown";

const FORMAT_LABELS: Record<ImportFormat, string> = {
  letterboxd: "Letterboxd diary",
  "letterboxd-watched": "Letterboxd watched",
  "letterboxd-watchlist": "Letterboxd watchlist",
  "letterboxd-ratings": "Letterboxd ratings",
  interis: "Interis export",
  unknown: "unknown",
};

function detectFormat(headers: string[], filename?: string): ImportFormat {
  const set = new Set(headers);
  if (set.has("TmdbId") && set.has("WatchedDate")) return "interis";
  if (set.has("Name") && set.has("Watched Date")) return "letterboxd";
  if (set.has("Name") && set.has("Date") && set.has("Year")) {
    const name = (filename ?? "").toLowerCase();
    if (name.includes("watchlist")) return "letterboxd-watchlist";
    // ratings.csv has a Rating column; watched.csv does not
    if (set.has("Rating") || name.includes("ratings")) return "letterboxd-ratings";
    return "letterboxd-watched";
  }
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
  mediaType: "movie" | "tv";
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
    mediaType: "movie",
    watchedDate,
    rating: parseRating(row["Rating"] ?? ""),
    rewatch: parseRewatch(row["Rewatch"] ?? ""),
    review: (row["Review"] ?? "").trim(),
    spoilers: false,
  };
}

function normalizeLetterboxdWatchlistRow(row: Record<string, string>): NormalizedRow | null {
  return normalizeLetterboxdWatchedRow(row);
}

function normalizeLetterboxdRatingsRow(row: Record<string, string>): NormalizedRow | null {
  const watchedDate = parseDate(row["Date"] ?? "");
  if (!watchedDate) return null;

  const title = (row["Name"] ?? "").trim();
  if (!title) return null;

  const yearRaw = Number.parseInt(row["Year"] ?? "", 10);
  const year = Number.isNaN(yearRaw) ? null : yearRaw;

  const rating = parseRating(row["Rating"] ?? "");
  if (!rating) return null; // no point importing a row with no rating

  return {
    title,
    year,
    tmdbId: null,
    mediaType: "movie",
    watchedDate,
    rating,
    rewatch: false,
    review: "",
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
    mediaType: "movie",
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

  const mediaTypeRaw = (row["MediaType"] ?? "").trim().toLowerCase();
  const mediaType: "movie" | "tv" = mediaTypeRaw === "tv" ? "tv" : "movie";

  return {
    title,
    year,
    tmdbId,
    mediaType,
    watchedDate,
    rating: parseRating(row["Rating"] ?? ""),
    rewatch: parseRewatch(row["Rewatch"] ?? ""),
    review: (row["Review"] ?? "").trim(),
    spoilers: (row["Spoilers"] ?? "").trim().toLowerCase() === "true",
  };
}

type ResolvedMedia =
  | { mediaType: "movie"; tmdbId: number }
  | { mediaType: "series"; tmdbId: number };

async function resolveMedia(row: NormalizedRow): Promise<ResolvedMedia | null> {
  // Interis format: tmdbId + explicit mediaType from export
  if (row.tmdbId) {
    const mediaType = row.mediaType === "tv" ? "series" : "movie";
    return { mediaType, tmdbId: row.tmdbId };
  }

  // 1. Movie search with year
  if (row.year) {
    const results = await searchMovieByTitleAndYear(row.title, row.year);
    if (results.length > 0 && results[0]) return { mediaType: "movie", tmdbId: results[0].id };
  }

  // 2. Movie search without year (year mismatch fallback)
  const movieFallback = await searchMovieByTitleAndYear(row.title, 0);
  if (movieFallback.length > 0 && movieFallback[0]) return { mediaType: "movie", tmdbId: movieFallback[0].id };

  // 3. TV series search with year
  if (row.year) {
    const seriesResults = await searchSeriesByTitleAndYear(row.title, row.year);
    if (seriesResults.length > 0 && seriesResults[0]) return { mediaType: "series", tmdbId: seriesResults[0].id };
  }

  // 4. TV series search without year
  const seriesFallback = await searchSeriesByTitleAndYear(row.title, 0);
  if (seriesFallback.length > 0 && seriesFallback[0]) return { mediaType: "series", tmdbId: seriesFallback[0].id };

  return null;
}

async function runPool(
  tasks: (() => Promise<void>)[],
  concurrency: number,
): Promise<void> {
  const queue = [...tasks];
  async function worker() {
    while (queue.length > 0) {
      const task = queue.shift();
      if (task) await task();
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, worker),
  );
}

export class DataImportService {
  static async importCsvStreaming(
    userId: string,
    csvText: string,
    write: (event: ImportStreamEvent) => void,
    filename?: string,
  ): Promise<void> {
    const headers = getCsvHeaders(csvText);
    const format = detectFormat(headers, filename);

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

    const tasks = rawRows.map((rawRow) => async () => {
      if (!rawRow) return;

      const normalized =
        format === "letterboxd"
          ? normalizeLetterboxdRow(rawRow)
          : format === "letterboxd-watched"
            ? normalizeLetterboxdWatchedRow(rawRow)
            : format === "letterboxd-watchlist"
              ? normalizeLetterboxdWatchlistRow(rawRow)
              : format === "letterboxd-ratings"
                ? normalizeLetterboxdRatingsRow(rawRow)
                : normalizeInterisRow(rawRow);

      const displayTitle = (rawRow["Name"] ?? rawRow["Title"] ?? "").trim();
      const displayYear = Number.parseInt(rawRow["Year"] ?? "", 10);
      const year = Number.isNaN(displayYear) ? null : displayYear;

      if (!normalized) {
        failed++;
        write({ type: "row", title: displayTitle, year, status: "failed", reason: "Missing required fields." });
        return;
      }

      let resolved: ResolvedMedia | null;
      try {
        resolved = await resolveMedia(normalized);
      } catch {
        failed++;
        write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "TMDB search failed." });
        return;
      }

      if (!resolved) {
        failed++;
        write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "Not found on TMDB as movie or TV series." });
        return;
      }

      // --- Ratings path ---
      if (format === "letterboxd-ratings") {
        const ratingOutOfTen = toRatingOutOfTen(normalized.rating);
        if (!ratingOutOfTen) {
          skipped++;
          write({ type: "row", title: normalized.title, year: normalized.year, status: "skipped", reason: "No rating." });
          return;
        }

        try {
          if (resolved.mediaType === "series") {
            const series = await SerialsService.findOrCreate(resolved.tmdbId);
            const already = await SerialsInteractionsRepository.hasRating(userId, series.id);
            if (already) {
              skipped++;
              write({ type: "row", title: normalized.title, year: normalized.year, status: "skipped", reason: "Rating already set." });
              return;
            }
            await SerialsInteractionsRepository.setRating(userId, series.id, ratingOutOfTen);
          } else {
            const movie = await MoviesService.findOrCreate(resolved.tmdbId);
            const already = await InteractionsService.hasRating(userId, movie.id);
            if (already) {
              skipped++;
              write({ type: "row", title: normalized.title, year: normalized.year, status: "skipped", reason: "Rating already set." });
              return;
            }
            await InteractionsService.setRating(userId, movie.id, ratingOutOfTen);
          }
          imported++;
          write({ type: "row", title: normalized.title, year: normalized.year, status: "imported" });
        } catch {
          failed++;
          write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "Failed to save rating." });
        }
        return;
      }

      // --- Watchlist path ---
      if (format === "letterboxd-watchlist") {
        try {
          if (resolved.mediaType === "series") {
            const series = await SerialsService.findOrCreate(resolved.tmdbId);
            await SerialsInteractionsRepository.setWatchlisted(userId, series.id);
          } else {
            const movie = await MoviesService.findOrCreate(resolved.tmdbId);
            await InteractionsService.setWatchlisted(userId, movie.id);
          }
          imported++;
          write({ type: "row", title: normalized.title, year: normalized.year, status: "imported" });
        } catch {
          failed++;
          write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "Failed to save to watchlist." });
        }
        return;
      }

      // --- Diary path (series) ---
      if (resolved.mediaType === "series") {
        let series: { id: number; tmdbId: number };
        try {
          series = await SerialsService.findOrCreate(resolved.tmdbId);
        } catch {
          failed++;
          write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "Failed to fetch series details." });
          return;
        }

        const alreadyExists =
          format === "letterboxd-watched"
            ? await SerialsInteractionsRepository.existsByUserAndSeries(userId, series.id)
            : await SerialsInteractionsRepository.existsByUserSeriesAndDate(userId, series.id, normalized.watchedDate);

        if (alreadyExists) {
          skipped++;
          write({ type: "row", title: normalized.title, year: normalized.year, status: "skipped", reason: "Already in diary." });
          return;
        }

        const seriesRating = toRatingOutOfTen(normalized.rating);
        const entry = await SerialsInteractionsRepository.insertSerialDiaryEntry({
          userId,
          seriesId: series.id,
          watchedDate: normalized.watchedDate,
          rating: seriesRating,
          rewatch: normalized.rewatch,
        });

        if (!entry) {
          failed++;
          write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "Failed to save diary entry." });
          return;
        }

        if (seriesRating) {
          try {
            await SerialsInteractionsRepository.setRating(userId, series.id, seriesRating);
          } catch {
            // non-fatal
          }
        }

        imported++;
        write({ type: "row", title: normalized.title, year: normalized.year, status: "imported" });
        return;
      }

      // --- Diary path (movie) ---
      let movie: { id: number; tmdbId: number } | null;
      try {
        movie = await MoviesService.findOrCreate(resolved.tmdbId);
      } catch {
        failed++;
        write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "Failed to fetch movie details." });
        return;
      }

      if (!movie) {
        failed++;
        write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "Not found on TMDB." });
        return;
      }

      const alreadyExists =
        format === "letterboxd-watched"
          ? await DiaryRepository.existsByUserAndMovie(userId, movie.id)
          : await DiaryRepository.existsByUserMovieAndDate(userId, movie.id, normalized.watchedDate);

      if (alreadyExists) {
        skipped++;
        write({ type: "row", title: normalized.title, year: normalized.year, status: "skipped", reason: "Already in diary." });
        return;
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
        return;
      }

      if (!entry) {
        failed++;
        write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "Failed to save entry." });
        return;
      }

      const ratingOutOfTen = toRatingOutOfTen(normalized.rating);
      if (ratingOutOfTen) {
        try {
          await InteractionsService.setRating(userId, movie.id, ratingOutOfTen);
        } catch {
          // non-fatal
        }
      }

      if (normalized.review) {
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
    });

    await runPool(tasks, 5);

    write({ type: "done", total: rawRows.length, imported, skipped, failed });
  }
}
