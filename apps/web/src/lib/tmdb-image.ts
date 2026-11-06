const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type TmdbImageSize = "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "w1280" | "original";

export const tmdbImageUrl = (path: string | null | undefined, size: TmdbImageSize): string | null =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
