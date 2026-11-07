const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// TMDB artwork for films and TV alike, with a plain placeholder when a title has none.
export const getPosterUrl = (posterPath: string | null | undefined): string =>
  posterPath ? `${TMDB_IMAGE_BASE}/w500${posterPath}` : "https://placehold.co/500x750/151515/8a8a8a?text=No+Poster";

export const getBackdropUrl = (backdropPath: string | null | undefined): string =>
  backdropPath ? `${TMDB_IMAGE_BASE}/w1280${backdropPath}` : "https://placehold.co/1600x900/101010/8a8a8a?text=No+Backdrop";

export const getStillUrl = (stillPath: string | null | undefined): string =>
  stillPath ? `${TMDB_IMAGE_BASE}/w500${stillPath}` : "https://placehold.co/400x225/101010/8a8a8a?text=No+Still";
