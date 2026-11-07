import {
  getFilmCredits,
  getFilmDetails,
  getSimilarFilms,
} from "../../../infrastructure/tmdb/films";

// Seam for gather()'s TMDB reads - getDetail() defaults to the real
// client below, tests can inject a fake to drive TMDB-down paths.
export type FilmsDetailTmdbClient = {
  getDetails: typeof getFilmDetails;
  getCredits: typeof getFilmCredits;
  getSimilar: typeof getSimilarFilms;
};

export const defaultFilmsDetailTmdbClient: FilmsDetailTmdbClient = {
  getDetails: getFilmDetails,
  getCredits: getFilmCredits,
  getSimilar: getSimilarFilms,
};
