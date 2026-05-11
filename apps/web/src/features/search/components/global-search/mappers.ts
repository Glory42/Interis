import type { GoogleBooksVolume } from "@/features/books/api";
import type { MbSearchResult } from "@/features/music/api";
import type { UserSearchResult } from "@/features/profile/api";
import type { TmdbSearchSeries } from "@/features/serials/api";
import type { TmdbSearchMovie } from "@/types/api";
import type {
  BookResultEntry,
  CinemaResultEntry,
  MusicResultEntry,
  SerialResultEntry,
  UserResultEntry,
} from "./types";

export const toUserEntry = (profile: UserSearchResult): UserResultEntry => {
  const profileName = profile.displayUsername?.trim() || profile.username;

  return {
    kind: "users",
    id: `users-${profile.id}`,
    username: profile.username,
    displayName: profileName,
    avatarUrl: profile.avatarUrl ?? profile.image ?? null,
  };
};

export const toCinemaEntry = (movie: TmdbSearchMovie): CinemaResultEntry => ({
  kind: "cinema",
  id: `cinema-${movie.id}`,
  tmdbId: movie.id,
  title: movie.title,
  posterPath: movie.poster_path,
  releaseDate: movie.release_date,
});

export const toSerialEntry = (series: TmdbSearchSeries): SerialResultEntry => ({
  kind: "serials",
  id: `serials-${series.id}`,
  tmdbId: series.id,
  title: series.name,
  posterPath: series.poster_path,
  firstAirDate: series.first_air_date,
});

export const toMusicEntry = (result: MbSearchResult): MusicResultEntry => {
  const artistName = result["artist-credit"]
    .map((credit) => credit.name + (credit.joinphrase ?? ""))
    .join("") || "Unknown Artist";

  return {
    kind: "music",
    id: `music-${result.id}`,
    mbid: result.id,
    title: result.title,
    artistName,
    primaryType: result["primary-type"] ?? null,
    firstReleaseDate: result["first-release-date"] ?? null,
  };
};

export const toBookEntry = (volume: GoogleBooksVolume): BookResultEntry => ({
  kind: "books",
  id: `books-${volume.id}`,
  volumeId: volume.id,
  title: volume.volumeInfo.title,
  authors: volume.volumeInfo.authors,
  coverImageUrl: volume.volumeInfo.imageLinks?.thumbnail ?? null,
  publishedDate: volume.volumeInfo.publishedDate ?? null,
});

export const toYear = (value: string | null | undefined): string | null => {
  if (!value || value.length < 4) {
    return null;
  }

  return value.slice(0, 4);
};
