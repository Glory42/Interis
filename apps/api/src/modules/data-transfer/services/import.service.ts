import { MoviesService } from "../../movies/movies.service";
import { SerialsService } from "../../serials/serials.service";
import { DiaryRepository } from "../../diary/repositories/diary.repository";
import { SerialsInteractionsRepository } from "../../serials/repositories/serials-interactions.repository";
import { SerialsReviewsRepository } from "../../serials/repositories/serials-reviews.repository";
import { ReviewsRepository } from "../../reviews/repositories/reviews.repository";
import { MediaInteractions, type MediaInteractionAdapter } from "../../media-interactions/media-interactions.repository";
import { parseCsv, getCsvHeaders } from "../helpers/csv-parser";
import {
  type ImportFormat,
  type ImportStreamEvent,
  type NormalizedRow,
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

// The shared shape every media type's diary-import path needs. Movies and
// series only differ in which repository backs each of these operations -
// see movieImportAdapter/seriesImportAdapter below - so importDiaryRow (the
// actual per-row workflow) is written exactly once against this interface
// instead of forking on mediaType at every step.
type DiaryImportMedia = { id: number; tmdbId: number };

type DiaryImportAdapter<TMedia extends DiaryImportMedia> = {
  interactions: MediaInteractionAdapter;
  findOrCreateMedia: (tmdbId: number) => Promise<TMedia>;
  fetchFailedReason: string;
  existsByUserAndMedia: (userId: string, mediaId: number) => Promise<boolean>;
  existsByUserMediaAndDate: (
    userId: string,
    mediaId: number,
    watchedDate: string,
  ) => Promise<boolean>;
  insertDiaryEntry: (input: {
    userId: string;
    mediaId: number;
    watchedDate: string;
    rating: number | null;
    rewatch: boolean;
  }) => Promise<{ id: string } | null>;
  upsertReview: (input: {
    userId: string;
    media: TMedia;
    diaryEntryId: string;
    content: string;
    containsSpoilers: boolean;
  }) => Promise<unknown>;
};

const movieImportAdapter: DiaryImportAdapter<DiaryImportMedia> = {
  interactions: MediaInteractions.forMovie(),
  findOrCreateMedia: (tmdbId) => MoviesService.findOrCreate(tmdbId),
  fetchFailedReason: "Failed to fetch movie details.",
  existsByUserAndMedia: (userId, movieId) => DiaryRepository.existsByUserAndMovie(userId, movieId),
  existsByUserMediaAndDate: (userId, movieId, watchedDate) =>
    DiaryRepository.existsByUserMovieAndDate(userId, movieId, watchedDate),
  insertDiaryEntry: ({ userId, mediaId, watchedDate, rating, rewatch }) =>
    DiaryRepository.insertEntry({ userId, movieId: mediaId, watchedDate, rating, rewatch }),
  upsertReview: ({ userId, media, diaryEntryId, content, containsSpoilers }) =>
    ReviewsRepository.upsertReview({
      userId,
      mediaType: "movie",
      tmdbId: media.tmdbId,
      movieId: media.id,
      diaryEntryId,
      content,
      containsSpoilers,
    }),
};

const seriesImportAdapter: DiaryImportAdapter<DiaryImportMedia> = {
  interactions: MediaInteractions.forSeries(),
  findOrCreateMedia: (tmdbId) => SerialsService.findOrCreate(tmdbId),
  fetchFailedReason: "Failed to fetch series details.",
  existsByUserAndMedia: (userId, seriesId) =>
    SerialsInteractionsRepository.existsByUserAndSeries(userId, seriesId),
  existsByUserMediaAndDate: (userId, seriesId, watchedDate) =>
    SerialsInteractionsRepository.existsByUserSeriesAndDate(userId, seriesId, watchedDate),
  insertDiaryEntry: ({ userId, mediaId, watchedDate, rating, rewatch }) =>
    SerialsInteractionsRepository.insertDiaryEntry({ userId, seriesId: mediaId, watchedDate, rating, rewatch }),
  upsertReview: ({ userId, media, diaryEntryId, content, containsSpoilers }) =>
    SerialsReviewsRepository.upsertReview({
      userId,
      seriesTmdbId: media.tmdbId,
      diaryEntryId,
      content,
      containsSpoilers,
    }),
};

const adapterFor = (mediaType: ResolvedMedia["mediaType"]): DiaryImportAdapter<DiaryImportMedia> =>
  mediaType === "series" ? seriesImportAdapter : movieImportAdapter;

type RowOutcome = { status: "imported" | "skipped" | "failed"; reason?: string };

// One diary row, for whichever media type resolveMedia() decided this row
// is - imported via the adapter above so movie and series rows share this
// exact sequence instead of two hand-maintained copies of it.
async function importDiaryRow(
  adapter: DiaryImportAdapter<DiaryImportMedia>,
  userId: string,
  tmdbId: number,
  format: ImportFormat,
  normalized: NormalizedRow,
): Promise<RowOutcome> {
  let media: DiaryImportMedia;
  try {
    media = await adapter.findOrCreateMedia(tmdbId);
  } catch {
    return { status: "failed", reason: adapter.fetchFailedReason };
  }

  const alreadyExists =
    format === "letterboxd-watched"
      ? await adapter.existsByUserAndMedia(userId, media.id)
      : await adapter.existsByUserMediaAndDate(userId, media.id, normalized.watchedDate);

  if (alreadyExists) {
    return { status: "skipped", reason: "Already in diary." };
  }

  const rating = toRatingOutOfTen(normalized.rating);

  let entry: { id: string } | null;
  try {
    entry = await adapter.insertDiaryEntry({
      userId,
      mediaId: media.id,
      watchedDate: normalized.watchedDate,
      rating,
      rewatch: normalized.rewatch,
    });
  } catch {
    entry = null;
  }

  if (!entry) {
    return { status: "failed", reason: "Failed to save diary entry." };
  }

  if (rating) {
    try {
      await adapter.interactions.setRating(userId, media.id, rating);
    } catch {
      // non-fatal
    }
  }

  if (normalized.review) {
    try {
      await adapter.upsertReview({
        userId,
        media,
        diaryEntryId: entry.id,
        content: normalized.review,
        containsSpoilers: normalized.spoilers,
      });
    } catch {
      // Review failure is non-fatal — diary entry is saved
    }
  }

  return { status: "imported" };
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

      const adapter = adapterFor(resolved.mediaType);

      // --- Ratings path ---
      if (format === "letterboxd-ratings") {
        const ratingOutOfTen = toRatingOutOfTen(normalized.rating);
        if (!ratingOutOfTen) {
          skipped++;
          write({ type: "row", title: normalized.title, year: normalized.year, status: "skipped", reason: "No rating." });
          return;
        }

        try {
          const media = await adapter.findOrCreateMedia(resolved.tmdbId);
          const already = await adapter.interactions.hasRating(userId, media.id);
          if (already) {
            skipped++;
            write({ type: "row", title: normalized.title, year: normalized.year, status: "skipped", reason: "Rating already set." });
            return;
          }
          await adapter.interactions.setRating(userId, media.id, ratingOutOfTen);
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
          const media = await adapter.findOrCreateMedia(resolved.tmdbId);
          await adapter.interactions.setWatchlisted(userId, media.id);
          imported++;
          write({ type: "row", title: normalized.title, year: normalized.year, status: "imported" });
        } catch {
          failed++;
          write({ type: "row", title: normalized.title, year: normalized.year, status: "failed", reason: "Failed to save to watchlist." });
        }
        return;
      }

      // --- Diary path (movie or series, driven by adapter) ---
      const outcome = await importDiaryRow(adapter, userId, resolved.tmdbId, format, normalized);
      if (outcome.status === "imported") imported++;
      if (outcome.status === "skipped") skipped++;
      if (outcome.status === "failed") failed++;
      write({ type: "row", title: normalized.title, year: normalized.year, status: outcome.status, reason: outcome.reason });
    });

    await runPool(tasks, 5);

    write({ type: "done", total: rawRows.length, imported, skipped, failed });
  }
}
