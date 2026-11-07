import { formatDateOnlyLabel } from "@/lib/time";

// firstAirDate/lastAirDate/episode.airDate are all date-only TMDB values
// ("YYYY-MM-DD") with no timezone.
export const toDateLabel = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  return formatDateOnlyLabel(value);
};

export const toEpisodeCodeLabel = (episodeNumber: number): string => {
  return `E${String(episodeNumber).padStart(2, "0")}`;
};

export const toYearFromDateLabel = (value: string | null): string => {
  if (!value || value.length < 4) {
    return "Year unknown";
  }

  return value.slice(0, 4);
};

type NextUp = { seasonNumber: number; episodeNumber: number } | null;

const pad2 = (value: number) => String(value).padStart(2, "0");

// "398/416 episodes · Next up S02E29", "416/416 episodes · Completed", or just the size before you start.
export const toReelCounterLabel = (
  watchedEpisodes: number,
  totalEpisodes: number | null,
  nextUp: NextUp,
): string | null => {
  if (watchedEpisodes === 0) return totalEpisodes ? `${totalEpisodes} episodes` : null;
  const progress = nextUp ? `Next up S${pad2(nextUp.seasonNumber)}E${pad2(nextUp.episodeNumber)}` : "Completed";
  return `${watchedEpisodes}/${totalEpisodes ?? "?"} episodes · ${progress}`;
};
