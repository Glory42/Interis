import type { SerialArchivePeriod, SerialArchiveSort } from "../../dto/serials.dto";

export type SerialsArchiveQueryInput = {
  selectedGenre: string | null;
  selectedLanguage: string | null;
  selectedPeriod: SerialArchivePeriod;
  sortBy: SerialArchiveSort;
  page: number;
  limit: number;
};

export type SerialsArchivePeriodWindow = {
  firstAirDateGte: string | null;
  firstAirDateLte: string | null;
  startYear: number | null;
  endYear: number | null;
};
