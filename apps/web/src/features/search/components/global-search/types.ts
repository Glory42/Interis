import type { UserSearchResult } from "@/features/profile/api";
import type { TmdbSearchSeries } from "@/features/tv/api";
import type { TmdbSearchFilm } from "@/types/api";

export type SearchMode = "home" | "scoped";
export type ScopedTarget = "users" | "movie" | "serials";
export type SectionTarget = ScopedTarget;

export type UserResultEntry = {
  kind: "users";
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type FilmResultEntry = {
  kind: "movie";
  id: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseDate: string;
  credit: string | null;
};

export type SeriesResultEntry = {
  kind: "serials";
  id: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  firstAirDate: string;
  credit: string | null;
};

export type SearchResultEntry =
  | UserResultEntry
  | FilmResultEntry
  | SeriesResultEntry;

export type SearchSection = {
  target: SectionTarget;
  label: string;
  items: SearchResultEntry[];
  isLoading: boolean;
  isError: boolean;
};

export type SearchSectionOffset = {
  section: SearchSection;
  startIndex: number;
};

export type SearchResultMappers = {
  toUserEntry: (profile: UserSearchResult) => UserResultEntry;
  toMovieEntry: (movie: TmdbSearchFilm) => FilmResultEntry;
  toSerialEntry: (series: TmdbSearchSeries) => SeriesResultEntry;
};
