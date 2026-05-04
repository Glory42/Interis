import type { ComponentType, CSSProperties } from "react";
import type { UserSearchResult } from "@/features/profile/api";
import type { TmdbSearchSeries } from "@/features/serials/api";
import type { TmdbSearchMovie } from "@/types/api";

export type SearchMode = "home" | "scoped";
export type ScopedTarget = "users" | "cinema" | "serials";

export type UserResultEntry = {
  kind: "users";
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type CinemaResultEntry = {
  kind: "cinema";
  id: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseDate: string;
};

export type SerialResultEntry = {
  kind: "serials";
  id: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  firstAirDate: string;
};

export type SearchResultEntry =
  | UserResultEntry
  | CinemaResultEntry
  | SerialResultEntry;

export type SearchSection = {
  target: ScopedTarget;
  label: string;
  items: SearchResultEntry[];
  isLoading: boolean;
  isError: boolean;
};

export type QuickLink = {
  target: ScopedTarget;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  color: string;
  tint: string;
};

export type SearchSectionOffset = {
  section: SearchSection;
  startIndex: number;
};

export type SearchResultMappers = {
  toUserEntry: (profile: UserSearchResult) => UserResultEntry;
  toCinemaEntry: (movie: TmdbSearchMovie) => CinemaResultEntry;
  toSerialEntry: (series: TmdbSearchSeries) => SerialResultEntry;
};
