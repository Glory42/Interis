import { formatDateOnlyLabel } from "@/lib/time";
import type { UpNextItem } from "@/features/tv/api";
import { getBackdropUrl, getStillUrl } from "@/features/media/tmdb-images";

const pad = (value: number) => String(value).padStart(2, "0");

// "S02E05", for labels and the compact strip.
export const episodeCode = (episode: { seasonNumber: number; episodeNumber: number }) =>
  `S${pad(episode.seasonNumber)}E${pad(episode.episodeNumber)}`;

// "S02 · E05 · 45M · NOV 3": the kicker over an episode still.
export const episodeKicker = (episode: {
  seasonNumber: number;
  episodeNumber: number;
  runtime: number | null;
  airDate: string | null;
}) =>
  [
    `S${pad(episode.seasonNumber)}`,
    `E${pad(episode.episodeNumber)}`,
    episode.runtime ? `${episode.runtime}M` : null,
    episode.airDate ? formatDateOnlyLabel(episode.airDate, { month: "short", day: "numeric" }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

const dayDiff = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

// "Today", "Tomorrow", else "Wed, Nov 18"; `today` is the API's day in the viewer's zone.
export const airDayLabel = (date: string, today: string) => {
  const diff = dayDiff(today, date);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return formatDateOnlyLabel(date, { weekday: "short", month: "short", day: "numeric" });
};

// The episode still, or the show's backdrop when TMDB has none.
export const stillFor = (item: UpNextItem) =>
  item.episode.stillPath ? getStillUrl(item.episode.stillPath) : getBackdropUrl(item.series.backdropPath);

// The timeline's date block: "SUN" / "22" / "NOV", plus "Today", "Tomorrow" or "In 5 days".
export const airDayParts = (date: string, today: string) => {
  const diff = dayDiff(today, date);
  return {
    weekday: formatDateOnlyLabel(date, { weekday: "short" }),
    day: formatDateOnlyLabel(date, { day: "numeric" }),
    month: formatDateOnlyLabel(date, { month: "short" }),
    relative: diff <= 0 ? "Today" : diff === 1 ? "Tomorrow" : `In ${diff} days`,
    isSoon: diff <= 1,
  };
};
