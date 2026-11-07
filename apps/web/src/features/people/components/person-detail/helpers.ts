const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const getCreditPosterUrl = (posterPath: string | null): string => {
  if (!posterPath) {
    return "https://placehold.co/300x450/1f1b2b/e8e3f7?text=No+Poster";
  }

  return `${TMDB_IMAGE_BASE}/w342${posterPath}`;
};
