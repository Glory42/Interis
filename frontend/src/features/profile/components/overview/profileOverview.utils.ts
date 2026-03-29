import type { DiaryEntry } from "@/types/api";

export type ProfileRecentActivityItem = {
  id: string;
  tmdbId: number;
  movieTitle: string;
  actionLabel: "Logged" | "Reviewed" | "Rated";
  ratingLabel: string | null;
  createdAt: string;
};

type ProfileMovieRating = {
  ratingOutOfFive: number;
  roundedStars: number;
};

const toFivePointRating = (ratingOutOfTen: number): number => {
  const normalized = Math.max(0, Math.min(10, ratingOutOfTen));
  return normalized / 2;
};

const formatRatingOutOfFive = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  if (Number.isInteger(rounded)) {
    return `${rounded.toFixed(0)}/5`;
  }

  return `${rounded.toFixed(1)}/5`;
};

const getTimestamp = (value: string): number => {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const buildMovieRatingMap = (
  entries: DiaryEntry[],
): Map<number, ProfileMovieRating> => {
  const map = new Map<number, ProfileMovieRating>();

  for (const entry of entries) {
    if (entry.rating === null) {
      continue;
    }

    if (map.has(entry.movieTmdbId)) {
      continue;
    }

    const ratingOutOfFive = toFivePointRating(entry.rating);
    map.set(entry.movieTmdbId, {
      ratingOutOfFive,
      roundedStars: Math.max(0, Math.min(5, Math.round(ratingOutOfFive))),
    });
  }

  return map;
};

export const buildRecentActivityItems = (
  entries: DiaryEntry[],
  limit = 4,
): ProfileRecentActivityItem[] => {
  const items: ProfileRecentActivityItem[] = [];

  for (const entry of entries) {
    items.push({
      id: `${entry.id}-logged`,
      tmdbId: entry.movieTmdbId,
      movieTitle: entry.movieTitle,
      actionLabel: "Logged",
      ratingLabel: null,
      createdAt: entry.createdAt,
    });

    if (entry.reviewContent?.trim()) {
      items.push({
        id: `${entry.id}-reviewed`,
        tmdbId: entry.movieTmdbId,
        movieTitle: entry.movieTitle,
        actionLabel: "Reviewed",
        ratingLabel: null,
        createdAt: entry.reviewCreatedAt ?? entry.createdAt,
      });
    }

    if (entry.rating !== null) {
      const ratingOutOfFive = toFivePointRating(entry.rating);
      items.push({
        id: `${entry.id}-rated`,
        tmdbId: entry.movieTmdbId,
        movieTitle: entry.movieTitle,
        actionLabel: "Rated",
        ratingLabel: formatRatingOutOfFive(ratingOutOfFive),
        createdAt: entry.createdAt,
      });
    }
  }

  return items
    .sort((left, right) => getTimestamp(right.createdAt) - getTimestamp(left.createdAt))
    .slice(0, limit);
};
