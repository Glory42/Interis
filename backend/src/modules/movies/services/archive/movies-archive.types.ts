import type { CinemaArchivePeriod, CinemaArchiveSort } from "../../dto/movies.dto";

export type MoviesArchiveQueryInput = {
  selectedGenre: string | null;
  selectedLanguage: string | null;
  selectedPeriod: CinemaArchivePeriod;
  sortBy: CinemaArchiveSort;
  page: number;
  limit: number;
};

export type MoviesArchivePeriodWindow = {
  releaseDateGte: string | null;
  releaseDateLte: string | null;
  startYear: number | null;
  endYear: number | null;
};
