import type { UserFilm } from "@/features/profile/api";
import { formatRelativeTime } from "@/lib/time";
import type { PublicProfile } from "@/types/api";

const monthYearShortFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
});

const monthYearLongFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
});

export const getProfileDisplayName = (profile: PublicProfile): string => {
  return profile.displayUsername ?? profile.name ?? profile.username;
};

export const formatJoinedDate = (
  value: string | null | undefined,
  variant: "short" | "long" = "short",
): string => {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return variant === "long"
    ? monthYearLongFormatter.format(date)
    : monthYearShortFormatter.format(date);
};

export const getRelativeTime = (value: string | null | undefined): string => {
  if (!value) {
    return "No activity yet";
  }

  return formatRelativeTime(value, { maxUnit: "year" });
};

export const getLatestWatchedDate = (films: UserFilm[]): string | null => {
  let latestTimestamp = Number.NEGATIVE_INFINITY;
  let latestValue: string | null = null;

  for (const film of films) {
    const timestamp = new Date(film.lastWatched).getTime();
    if (Number.isNaN(timestamp)) {
      continue;
    }

    if (timestamp > latestTimestamp) {
      latestTimestamp = timestamp;
      latestValue = film.lastWatched;
    }
  }

  return latestValue;
};

export const getFavoriteGenres = (films: UserFilm[], limit = 4): string[] => {
  const genreCounts = new Map<string, number>();

  for (const film of films) {
    const genres = film.genres ?? [];
    for (const genre of genres) {
      const currentCount = genreCounts.get(genre.name) ?? 0;
      genreCounts.set(genre.name, currentCount + 1);
    }
  }

  return [...genreCounts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, limit)
    .map(([name]) => name);
};
