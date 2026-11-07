import { FilmsService } from "../../films/films.service";
import { TvService } from "../../tv/tv.service";
import { TvReviewsRepository } from "../../tv/repositories/tv-reviews.repository";
import { ReviewsRepository } from "../../reviews/repositories/reviews.repository";
import { MediaInteractions, type MediaInteractionAdapter } from "../../media-interactions/media-interactions.repository";
import { YourRatingService } from "../../media-interactions/services/your-rating.service";
import { WatchLogStores } from "../../media/repositories/watch-log.repository";
import type { WatchLogStore } from "../../media/types/watch-log.types";
import type { MediaType } from "../../media/constants/media-type.constant";
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
  mediaType: MediaType;
  interactions: MediaInteractionAdapter;
  logs: WatchLogStore;
  findOrCreateMedia: (tmdbId: number) => Promise<TMedia>;
  fetchFailedReason: string;
  createReview: (input: {
    userId: string;
    media: TMedia;
    diaryEntryId: string;
    content: string;
    containsSpoilers: boolean;
  }) => Promise<unknown>;
};

const filmImportAdapter: DiaryImportAdapter<DiaryImportMedia> = {
  mediaType: "movie",
  interactions: MediaInteractions.forMovie(),
  logs: WatchLogStores.film,
  findOrCreateMedia: (tmdbId) => FilmsService.findOrCreate(tmdbId),
  fetchFailedReason: "Failed to fetch movie details.",
  createReview: ({ userId, media, diaryEntryId, content, containsSpoilers }) =>
    ReviewsRepository.createReview({
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
  mediaType: "tv",
  interactions: MediaInteractions.forSeries(),
  logs: WatchLogStores.series,
  findOrCreateMedia: (tmdbId) => TvService.findOrCreate(tmdbId),
  fetchFailedReason: "Failed to fetch series details.",
  createReview: ({ userId, media, diaryEntryId, content, containsSpoilers }) =>
    TvReviewsRepository.createReview({
      userId,
      seriesTmdbId: media.tmdbId,
      diaryEntryId,
      content,
      containsSpoilers,
    }),
};

const adapterFor = (mediaType: ResolvedMedia["mediaType"]): DiaryImportAdapter<DiaryImportMedia> =>
  mediaType === "series" ? seriesImportAdapter : filmImportAdapter;

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

  const alreadyExists = await adapter.logs.hasLog(
    userId,
    media.id,
    format === "letterboxd-watched" ? undefined : normalized.watchedDate,
  );

  if (alreadyExists) {
    return { status: "skipped", reason: "Already in diary." };
  }

  const rating = toRatingOutOfTen(normalized.rating);

  let entry: { id: string } | null;
  try {
    entry = await adapter.logs.insert({
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
      await YourRatingService.followLatestRatedLog(adapter.mediaType, userId, media.id, {
        before: null,
        writtenLogId: entry.id,
      });
    } catch {
      // non-fatal
    }
  }

  if (normalized.review) {
    try {
      await adapter.createReview({
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
