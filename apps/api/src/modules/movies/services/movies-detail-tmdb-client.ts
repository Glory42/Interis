import {
  getMovieCredits,
  getMovieDetails,
  getSimilarMovies,
} from "../../../infrastructure/tmdb/movies";

// Seam for gather()'s TMDB reads - getDetail() defaults to the real
// client below, tests can inject a fake to drive TMDB-down paths.
export type MoviesDetailTmdbClient = {
  getDetails: typeof getMovieDetails;
  getCredits: typeof getMovieCredits;
  getSimilar: typeof getSimilarMovies;
};

export const defaultMoviesDetailTmdbClient: MoviesDetailTmdbClient = {
  getDetails: getMovieDetails,
  getCredits: getMovieCredits,
  getSimilar: getSimilarMovies,
};
