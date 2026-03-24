const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const getPosterUrl = (posterPath: string | null | undefined): string => {
  if (!posterPath) {
    return "https://placehold.co/500x750/151931/cfd7ff?text=No+Poster";
  }

  return `${TMDB_IMAGE_BASE}/w500${posterPath}`;
};

export const getBackdropUrl = (
  backdropPath: string | null | undefined,
): string => {
  if (!backdropPath) {
    return "https://placehold.co/1600x900/121528/cfd7ff?text=No+Backdrop";
  }

  return `${TMDB_IMAGE_BASE}/w1280${backdropPath}`;
};

export const toReleaseYear = (
  releaseDate: string | null | undefined,
): string | null => {
  if (!releaseDate || releaseDate.length < 4) {
    return null;
  }

  return releaseDate.slice(0, 4);
};
