import type { MediaType } from "@/types/common";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

type PosterSize = "w185" | "w342" | "w500";

export const getPosterUrl = (
  posterPath: string | null | undefined,
  size: PosterSize = "w342",
): string | null => (posterPath ? `${TMDB_IMAGE_BASE}/${size}${posterPath}` : null);

export const getBackdropUrl = (backdropPath: string | null | undefined): string | null =>
  backdropPath ? `${TMDB_IMAGE_BASE}/w1280${backdropPath}` : null;

export const getProfileImageUrl = (profilePath: string | null | undefined): string | null =>
  profilePath ? `${TMDB_IMAGE_BASE}/w185${profilePath}` : null;

export const toReleaseYear = (releaseDate: string | null | undefined): string | null =>
  releaseDate && releaseDate.length >= 4 ? releaseDate.slice(0, 4) : null;

export const formatRuntimeLabel = (runtimeMinutes: number | null | undefined): string | null => {
  if (!runtimeMinutes || !Number.isFinite(runtimeMinutes) || runtimeMinutes <= 0) {
    return null;
  }

  const hours = Math.floor(runtimeMinutes / 60);
  const minutes = Math.floor(runtimeMinutes) % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes} min`;
};

/** Formats a 0–10 rating as "X/10" with up to one decimal place. */
export const formatRatingLabel = (
  rating: number | null | undefined,
  options: { withSuffix?: boolean } = {},
): string | null => {
  if (rating === null || rating === undefined || Number.isNaN(rating)) return null;
  const normalized = Math.max(0, Math.min(10, Math.round(rating * 10) / 10));
  const formatted = Number.isInteger(normalized)
    ? `${normalized}`
    : normalized.toFixed(1).replace(/\.0$/, "");
  return (options.withSuffix ?? true) ? `${formatted}/10` : formatted;
};

export const mediaHref = (mediaType: MediaType, tmdbId: number) =>
  mediaType === "tv"
    ? ({ pathname: "/serial/[tmdbId]", params: { tmdbId: String(tmdbId) } } as const)
    : ({ pathname: "/movie/[tmdbId]", params: { tmdbId: String(tmdbId) } } as const);
