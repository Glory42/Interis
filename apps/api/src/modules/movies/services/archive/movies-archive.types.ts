import type { MovieArchivePeriod, MovieArchiveSort } from "../../dto/movies.dto";

export type MoviesArchiveQueryInput = {
  selectedGenre: string | null;
  selectedLanguage: string | null;
  selectedPeriod: MovieArchivePeriod;
  sortBy: MovieArchiveSort;
  page: number;
  limit: number;
  viewerUserId: string | null;
};

export type MoviesArchivePeriodWindow = {
  releaseDateGte: string | null;
  releaseDateLte: string | null;
  startYear: number | null;
  endYear: number | null;
};
