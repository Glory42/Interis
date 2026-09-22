import {
  getMovieCredits,
  getMovieDetails,
  getSimilarMovies,
} from "../../../infrastructure/tmdb/movies";

// The seam MoviesDetailService.gather() reads TMDB through. Production
// code never constructs this explicitly - getDetail() defaults to
// defaultMoviesDetailTmdbClient below - but a test can pass a fake client
// through getDetail()'s own public interface to drive gather()'s
// TMDB-down / partial-failure branches, which no test previously reached.
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
