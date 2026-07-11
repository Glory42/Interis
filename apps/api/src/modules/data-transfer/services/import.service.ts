import { MoviesService } from "../../movies/movies.service";
import { SerialsService } from "../../serials/serials.service";
import { DiaryRepository } from "../../diary/repositories/diary.repository";
import { SerialsInteractionsRepository } from "../../serials/repositories/serials-interactions.repository";
import { InteractionsService } from "../../interactions/interactions.service";
import { parseCsv, getCsvHeaders } from "../helpers/csv-parser";
import {
  type ImportStreamEvent,
  type ResolvedMedia,
  FORMAT_LABELS,
  detectFormat,
  toRatingOutOfTen,
  normalizeLetterboxdRow,
  normalizeLetterboxdWatchedRow,
  normalizeLetterboxdWatchlistRow,
  normalizeLetterboxdRatingsRow,
  normalizeInterisRow,
  resolveMedia,
  runPool,
} from "../helpers/import-normalizer.helper";

export type { ImportStreamEvent };

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
        const entry = await SerialsInteractionsRepository.insertDiaryEntry({
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
