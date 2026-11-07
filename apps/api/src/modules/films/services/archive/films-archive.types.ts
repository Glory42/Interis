import type { FilmArchivePeriod, FilmArchiveSort } from "../../dto/films.dto";

export type FilmsArchiveQueryInput = {
  selectedGenre: string | null;
  selectedLanguage: string | null;
  selectedPeriod: FilmArchivePeriod;
  sortBy: FilmArchiveSort;
  page: number;
  limit: number;
  viewerUserId: string | null;
};

export type FilmsArchivePeriodWindow = {
  releaseDateGte: string | null;
  releaseDateLte: string | null;
  startYear: number | null;
  endYear: number | null;
};
