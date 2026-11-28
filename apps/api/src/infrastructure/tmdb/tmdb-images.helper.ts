const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type TmdbImageSize = "w185" | "w342" | "w500" | "w780" | "w1280" | "h632";

// TMDB artwork URL for a stored poster/backdrop/profile path, or null when there is none.
export const tmdbImageUrl = (imagePath: string | null | undefined, size: TmdbImageSize): string | null =>
  imagePath ? `${TMDB_IMAGE_BASE}/${size}${imagePath}` : null;
