import type { SeriesArchivePeriod, SeriesArchiveSort } from "../../dto/tv.dto";

export type TvArchiveQueryInput = {
  selectedGenre: string | null;
  selectedLanguage: string | null;
  selectedPeriod: SeriesArchivePeriod;
  sortBy: SeriesArchiveSort;
  page: number;
  limit: number;
  viewerUserId: string | null;
};

export type TvArchivePeriodWindow = {
  firstAirDateGte: string | null;
  firstAirDateLte: string | null;
  startYear: number | null;
  endYear: number | null;
};
