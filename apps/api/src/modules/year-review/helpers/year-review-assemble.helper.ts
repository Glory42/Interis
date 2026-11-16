import type { MediaType } from "../../media/constants/media-type.constant";
import type { YearReview, YearReviewDepth, YearTotals } from "../types/year-review.types";

// Fewer logs than this and the page and card show the short version.
export const YEAR_REVIEW_FULL_MIN_LOGS = 10;
const EXCERPT_LENGTH = 220;

export const depthFor = (logs: number): YearReviewDepth =>
  logs === 0 ? "empty" : logs < YEAR_REVIEW_FULL_MIN_LOGS ? "thin" : "full";

const toHours = (minutes: number) => Math.round(minutes / 60);
const roundRating = (value: number | null) => (value === null ? null : Math.round(value * 100) / 100);

export const totalsWithHours = (totals: YearTotals): YearReview["totals"] => ({
  ...totals,
  logs: totals.filmLogs + totals.seriesLogs,
  hoursWatched: toHours(totals.filmMinutes + totals.episodeMinutes),
  filmHours: toHours(totals.filmMinutes),
  seriesHours: toHours(totals.episodeMinutes),
});

// The API leaves out months with no logs; the recap keeps all twelve.
export const fillMonths = (rows: { month: number; count: number }[]) => {
  const counts = new Map(rows.map((row) => [Number(row.month), Number(row.count)]));
  return Array.from({ length: 12 }, (_, index) => ({ month: index + 1, count: counts.get(index + 1) ?? 0 }));
};

// The month with the most logs, the earlier one on a tie; null for an empty year.
export const busiestMonthOf = (months: { month: number; count: number }[]) =>
  months.reduce<{ month: number; count: number } | null>(
    (best, month) => (month.count > 0 && (!best || month.count > best.count) ? month : best),
    null,
  );

const excerptOf = (content: string) => {
  const flat = content.replace(/\s+/g, " ").trim();
  return flat.length <= EXCERPT_LENGTH ? flat : `${flat.slice(0, EXCERPT_LENGTH - 1).trimEnd()}…`;
};

type MostLikedRow = {
  id: string;
  content: string;
  containsSpoilers: boolean;
  mediaType: string;
  tmdbId: number | null;
  mediaTitle: string | null;
  posterPath: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  likeCount: number;
};

// Season and episode Reviews read as "Title · Season 2" / "Title · S2E3", as on the review page.
export const toMostLikedReview = (row: MostLikedRow | null): YearReview["reviews"]["mostLiked"] => {
  if (!row) return null;
  const isFilm = row.mediaType === "movie";
  let mediaTitle = row.mediaTitle ?? (isFilm ? "Unknown film" : "Unknown series");
  if (!isFilm && row.seasonNumber !== null) {
    const label = row.episodeNumber !== null ? `S${row.seasonNumber}E${row.episodeNumber}` : `Season ${row.seasonNumber}`;
    mediaTitle = `${mediaTitle} · ${label}`;
  }
  return {
    id: row.id,
    mediaType: (isFilm ? "movie" : "tv") as MediaType,
    tmdbId: row.tmdbId,
    mediaTitle,
    posterPath: row.posterPath,
    likeCount: Number(row.likeCount),
    containsSpoilers: row.containsSpoilers,
    excerpt: row.containsSpoilers ? "" : excerptOf(row.content),
  };
};

export const roundedRatings = (average: number | null, ratedLogs: number, communityAverage: number | null) => ({
  average: roundRating(average),
  ratedLogs,
  communityAverage: roundRating(communityAverage),
});
