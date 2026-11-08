import { MONTHS, toIsoWeek } from "@/features/media/archive/week-label";
import type { FeedItem, FeedTitleGroup, GroupedFeedEntry } from "@/features/feed/types";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export type FeedRow =
  | { kind: "title"; key: string; group: FeedTitleGroup }
  | { kind: "activity"; key: string; item: FeedItem }
  | { kind: "titles"; key: string; action: "liked" | "watchlisted"; actor: FeedTitleGroup["actor"]; titles: FeedTitleGroup["movie"][] }
  | { kind: "follows"; key: string; actor: FeedItem["actor"]; usernames: string[] }
  | { kind: "episodes"; key: string; actor: FeedTitleGroup["actor"]; movie: FeedTitleGroup["movie"]; groups: FeedTitleGroup[] };

export type FeedDay = { key: string; label: string; week: string; rows: FeedRow[] };

// What the person did with the title: the strongest action wins.
export const verbFor = (group: FeedTitleGroup): string => {
  if (group.watched) return group.rewatch ? "rewatched" : "watched";
  if (group.review) return "reviewed";
  if (group.rating !== null) return "rated";
  if (group.liked) return "liked";
  return "wants to watch";
};

const toLocalDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// "Watched Nov 1" when the watch predates the log (logged today, watched last week); null otherwise.
export const watchedDayLabel = (group: FeedTitleGroup): string | null => {
  const watchedDate = group.log?.watchedDate;
  if (!watchedDate) return null;
  const loggedAt = new Date(group.createdAt);
  if (watchedDate === toLocalDayKey(loggedAt)) return null;
  const [year, month, day] = watchedDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  const label = `${MONTHS[month - 1]} ${day}`;
  return `Watched ${year === loggedAt.getFullYear() ? label : `${label}, ${year}`}`;
};

const isOnly = (group: FeedTitleGroup, action: "liked" | "watchlisted") =>
  group[action] &&
  !(action === "liked" ? group.watchlisted : group.liked) &&
  !group.watched &&
  group.rating === null &&
  !group.review;

// Back-to-back entries sharing a key fold into one row. Mirrors foldKey in the
// API's social-feed-grouping.helper.ts, which counts rows the same way.
const foldKey = (entry: GroupedFeedEntry): string | null => {
  if (entry.kind === "activity") {
    return entry.item.kind === "followed_user" ? `follows:${entry.item.actor.id}` : null;
  }
  if (entry.seasonNumber !== null && !entry.review) {
    return `episodes:${entry.actor.id}:${entry.movie.mediaType}:${entry.movie.tmdbId}`;
  }
  if (isOnly(entry, "liked")) return `liked:${entry.actor.id}`;
  if (isOnly(entry, "watchlisted")) return `watchlisted:${entry.actor.id}`;
  return null;
};

const toRow = (entry: GroupedFeedEntry): FeedRow =>
  entry.kind === "title"
    ? { kind: "title", key: entry.id, group: entry }
    : { kind: "activity", key: entry.item.id, item: entry.item };

const toFoldedRow = (run: GroupedFeedEntry[]): FeedRow => {
  const key = run.map((entry) => (entry.kind === "title" ? entry.id : entry.item.id)).join("+");
  const items = run.flatMap((entry) => (entry.kind === "activity" ? [entry.item] : []));
  if (items.length > 0) {
    const usernames = items.flatMap((item) => (item.metadata.targetUsername ? [item.metadata.targetUsername] : []));
    return { kind: "follows", key, actor: items[0]!.actor, usernames };
  }
  const groups = run.flatMap((entry) => (entry.kind === "title" ? [entry] : []));
  const [first] = groups;
  if (first!.seasonNumber !== null) return { kind: "episodes", key, actor: first!.actor, movie: first!.movie, groups };
  const action = first!.liked ? "liked" : "watchlisted";
  return { kind: "titles", key, action, actor: first!.actor, titles: groups.map((group) => group.movie) };
};

// A same-day run of one person's likes, watchlist adds, follows, or one show's
// seasons and episodes becomes one row; a run of one keeps its card.
const foldRuns = (entries: GroupedFeedEntry[]): FeedRow[] => {
  const rows: FeedRow[] = [];
  let index = 0;
  while (index < entries.length) {
    const key = foldKey(entries[index]!);
    let end = index + 1;
    while (key !== null && end < entries.length && foldKey(entries[end]!) === key) end += 1;
    const run = entries.slice(index, end);
    rows.push(run.length > 1 ? toFoldedRow(run) : toRow(run[0]!));
    index = end;
  }
  return rows;
};

const VERB_ORDER = ["rewatched", "watched", "reviewed", "rated", "liked", "wants to watch"];

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

// Splits the grouped feed into local days, each headed by a slate ("MON · NOV 2" · "WK 45").
export const toFeedDays = (entries: GroupedFeedEntry[]): FeedDay[] => {
  const days: { key: string; date: Date; entries: GroupedFeedEntry[] }[] = [];
  for (const entry of entries) {
    const date = new Date(entry.kind === "title" ? entry.createdAt : entry.item.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const day = days.at(-1)?.key === key ? days.at(-1)! : days[days.push({ key, date, entries: [] }) - 1]!;
    day.entries.push(entry);
  }
  return days.map(({ key, date, entries: dayEntries }) => ({
    key,
    label: `${WEEKDAYS[date.getDay()]} · ${MONTHS[date.getMonth()]} ${date.getDate()}`,
    week: `WK ${toIsoWeek(date)}`,
    rows: foldRuns(dayEntries),
  }));
};
