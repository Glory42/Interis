import { searchMovieByTitleAndYear } from "../../../infrastructure/tmdb/cinemas";
import { searchSeriesByTitleAndYear } from "../../../infrastructure/tmdb/serials";
import type { MediaType } from "../../media/constants/media-type.constant";

export type ImportStreamEvent =
  | { type: "start"; total: number; format: string }
  | { type: "row"; title: string; year: number | null; status: "imported" | "skipped" | "failed"; reason?: string }
  | { type: "done"; total: number; imported: number; skipped: number; failed: number };

export type ImportFormat = "letterboxd" | "letterboxd-watched" | "letterboxd-watchlist" | "letterboxd-ratings" | "interis" | "unknown";

export const FORMAT_LABELS: Record<ImportFormat, string> = {
  letterboxd: "Letterboxd diary",
  "letterboxd-watched": "Letterboxd watched",
  "letterboxd-watchlist": "Letterboxd watchlist",
  "letterboxd-ratings": "Letterboxd ratings",
  interis: "Interis export",
  unknown: "unknown",
};

export function detectFormat(headers: string[], filename?: string): ImportFormat {
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

export function parseRating(raw: string): number | null {
  const n = Number.parseFloat(raw);
  if (Number.isNaN(n) || n <= 0) return null;
  const clamped = Math.min(5, Math.max(0.5, n));
  return Math.round(clamped * 2) / 2;
}

export function toRatingOutOfTen(sourceRating: number | null): number | null {
  if (sourceRating === null) return null;
  return Number((sourceRating * 2).toFixed(1));
}

export function parseDate(raw: string): string | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return null;
  return raw.trim();
}

export function parseRewatch(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === "yes" || v === "true";
}

export type NormalizedRow = {
  title: string;
  year: number | null;
  tmdbId: number | null;
  mediaType: MediaType;
  watchedDate: string;
  rating: number | null;
  rewatch: boolean;
  review: string;
  spoilers: boolean;
};

export function normalizeLetterboxdRow(row: Record<string, string>): NormalizedRow | null {
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

export function normalizeLetterboxdWatchlistRow(row: Record<string, string>): NormalizedRow | null {
  return normalizeLetterboxdWatchedRow(row);
}

export function normalizeLetterboxdRatingsRow(row: Record<string, string>): NormalizedRow | null {
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

export function normalizeLetterboxdWatchedRow(row: Record<string, string>): NormalizedRow | null {
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

export function normalizeInterisRow(row: Record<string, string>): NormalizedRow | null {
  const watchedDate = parseDate(row["WatchedDate"] ?? "");
  if (!watchedDate) return null;

  const title = (row["Title"] ?? "").trim();
  if (!title) return null;

  const tmdbIdRaw = Number.parseInt(row["TmdbId"] ?? "", 10);
  const tmdbId = Number.isNaN(tmdbIdRaw) ? null : tmdbIdRaw;

  const yearRaw = Number.parseInt(row["Year"] ?? "", 10);
  const year = Number.isNaN(yearRaw) ? null : yearRaw;

  const mediaTypeRaw = (row["MediaType"] ?? "").trim().toLowerCase();
  const mediaType: MediaType = mediaTypeRaw === "tv" ? "tv" : "movie";

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

export type ResolvedMedia =
  | { mediaType: "movie"; tmdbId: number }
  | { mediaType: "series"; tmdbId: number };

export async function resolveMedia(row: NormalizedRow): Promise<ResolvedMedia | null> {
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

export async function runPool(
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
