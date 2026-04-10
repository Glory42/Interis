import type { UserSearchResult } from "@/features/profile/api";
import type { TmdbSearchSeries } from "@/features/serials/api";
import type { TmdbSearchMovie } from "@/types/api";
import type { CinemaResultEntry, SerialResultEntry, UserResultEntry } from "./types";

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

export const toYear = (value: string | null | undefined): string | null => {
  if (!value || value.length < 4) {
    return null;
  }

  return value.slice(0, 4);
};
