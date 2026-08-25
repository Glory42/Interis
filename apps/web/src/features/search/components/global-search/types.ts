import type { ComponentType, CSSProperties } from "react";
import type { UserSearchResult } from "@/features/profile/api";
import type { TmdbSearchSeries } from "@/features/serials/api";
import type { TmdbSearchMovie } from "@/types/api";
import type { MbSearchResult } from "@/features/music/api";
import type { GoogleBooksVolume } from "@/features/books/api";

export type SearchMode = "home" | "scoped";
export type ScopedTarget = "users" | "cinema" | "serials" | "music" | "books";
// Home (unscoped) sections also include a merged movies+TV section, which
// isn't an individually enterable scope the way ScopedTarget values are.
export type SectionTarget = ScopedTarget | "titles";

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

export type MusicResultEntry = {
  kind: "music";
  id: string;
  mbid: string;
  title: string;
  artistName: string;
  primaryType: string | null;
  firstReleaseDate: string | null;
};

export type BookResultEntry = {
  kind: "books";
  id: string;
  volumeId: string;
  title: string;
  authors: string[];
  coverImageUrl: string | null;
  publishedDate: string | null;
};

export type SearchResultEntry =
  | UserResultEntry
  | CinemaResultEntry
  | SerialResultEntry
  | MusicResultEntry
  | BookResultEntry;

export type SearchSection = {
  target: SectionTarget;
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
  toMusicEntry: (result: MbSearchResult) => MusicResultEntry;
  toBookEntry: (volume: GoogleBooksVolume) => BookResultEntry;
};
