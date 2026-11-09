import { MONTHS, toIsoWeek } from "@/features/media/archive/week-label";
import type { FeedRow, FeedTitleGroup } from "@/features/feed/types";
import { parseDateOnly } from "@/lib/time";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export type FeedDay = { key: string; label: string; week: string; rows: FeedRow[] };

// What the person did with the title: the strongest action wins.
export const verbFor = (group: FeedTitleGroup): string => {
  if (group.watched) return group.rewatch ? "rewatched" : "watched";
  if (group.review) return "reviewed";
  if (group.rating !== null) return "rated";
  if (group.liked) return "liked";
  return "wants to watch";
};

// "Watched Nov 1" when the watch predates the log's day (logged today, watched last week); null otherwise.
export const watchedDayLabel = (group: FeedTitleGroup, loggedDay: string): string | null => {
  const watchedDate = group.log?.watchedDate;
  if (!watchedDate || watchedDate === loggedDay) return null;
  const [year, month, day] = watchedDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  const label = `${MONTHS[month - 1]} ${day}`;
  return `Watched ${year === Number(loggedDay.slice(0, 4)) ? label : `${label}, ${year}`}`;
};

const VERB_ORDER = ["rewatched", "watched", "reviewed", "rated", "liked", "wants to watch"];

// The page of a film or a series.
export const titleRoute = (mediaType: string) => (mediaType === "tv" ? "/serials/$tmdbId" : "/movies/$tmdbId");

const pad = (value: number) => String(value).padStart(2, "0");

// "S01E04" for an episode, "S01" for a whole season.
export const episodeCode = (group: FeedTitleGroup): string =>
  `S${pad(group.seasonNumber ?? 0)}${group.episodeNumber !== null ? `E${pad(group.episodeNumber)}` : ""}`;

export const titlesVerb = (row: Extract<FeedRow, { kind: "titles" }>) =>
  row.action === "liked" ? `liked ${row.titles.length} titles` : `added ${row.titles.length} titles to their watchlist`;

export const followsVerb = (row: Extract<FeedRow, { kind: "follows" }>) => `followed ${row.usernames.length} people`;

// "rated and liked 8 episodes" for a folded run of one show's seasons and episodes.
export const episodesSummary = (groups: FeedTitleGroup[]): string => {
  const verbs = VERB_ORDER.filter((verb) => groups.some((group) => verbFor(group) === verb));
  const hasSeasons = groups.some((group) => group.episodeNumber === null);
  const hasEpisodes = groups.some((group) => group.episodeNumber !== null);
  const unit = hasSeasons && hasEpisodes ? "seasons and episodes" : hasSeasons ? "seasons" : "episodes";
  return `${verbs.join(" and ")} ${groups.length} ${unit}`;
};

// Splits the rows into the days the API gave them, each headed by a slate ("MON · NOV 2" · "WK 45").
export const toFeedDays = (rows: FeedRow[]): FeedDay[] => {
  const days: FeedDay[] = [];
  for (const row of rows) {
    const last = days.at(-1);
    if (last?.key === row.day) {
      last.rows.push(row);
      continue;
    }
    const date = parseDateOnly(row.day);
    days.push({
      key: row.day,
      label: `${WEEKDAYS[date.getDay()]} · ${MONTHS[date.getMonth()]} ${date.getDate()}`,
      week: `WK ${toIsoWeek(date)}`,
      rows: [row],
    });
  }
  return days;
};
