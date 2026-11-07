import { MONTHS, toIsoWeek } from "@/features/media/archive/week-label";
import type { FeedItem, FeedTitleGroup, GroupedFeedEntry } from "@/features/feed/types";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export type FeedRow =
  | { kind: "title"; key: string; group: FeedTitleGroup }
  | { kind: "activity"; key: string; item: FeedItem }
  | { kind: "likes"; key: string; actor: FeedTitleGroup["actor"]; titles: FeedTitleGroup["movie"][] };

export type FeedDay = { key: string; label: string; week: string; rows: FeedRow[] };

// What the person did with the title: the strongest action wins.
export const verbFor = (group: FeedTitleGroup): string => {
  if (group.watched) return group.rewatch ? "rewatched" : "watched";
  if (group.review) return "reviewed";
  if (group.rating !== null) return "rated";
  if (group.liked) return "liked";
  return "wants to watch";
};

const isLikeOnly = (group: FeedTitleGroup) =>
  group.liked && !group.watched && group.rating === null && !group.review && !group.watchlisted;

const toRow = (entry: GroupedFeedEntry): FeedRow =>
  entry.kind === "title"
    ? { kind: "title", key: entry.id, group: entry }
    : { kind: "activity", key: entry.item.id, item: entry.item };

// Back-to-back likes from one person become "liked 2 titles"; a lone like keeps its card.
const collapseLikes = (rows: FeedRow[]): FeedRow[] => {
  const result: FeedRow[] = [];
  let index = 0;
  while (index < rows.length) {
    const row = rows[index]!;
    if (row.kind !== "title" || !isLikeOnly(row.group)) {
      result.push(row);
      index += 1;
      continue;
    }
    const run = [row.group];
    while (index + run.length < rows.length) {
      const next = rows[index + run.length]!;
      if (next.kind !== "title" || !isLikeOnly(next.group) || next.group.actor.id !== row.group.actor.id) break;
      run.push(next.group);
    }
    result.push(
      run.length > 1
        ? { kind: "likes", key: run.map((group) => group.id).join("+"), actor: row.group.actor, titles: run.map((group) => group.movie) }
        : row,
    );
    index += run.length;
  }
  return result;
};

// Splits the grouped feed into local days, each headed by a slate ("MON · NOV 2" · "WK 45").
export const toFeedDays = (entries: GroupedFeedEntry[]): FeedDay[] => {
  const days: { key: string; date: Date; rows: FeedRow[] }[] = [];
  for (const entry of entries) {
    const date = new Date(entry.kind === "title" ? entry.createdAt : entry.item.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const day = days.at(-1)?.key === key ? days.at(-1)! : days[days.push({ key, date, rows: [] }) - 1]!;
    day.rows.push(toRow(entry));
  }
  return days.map(({ key, date, rows }) => ({
    key,
    label: `${WEEKDAYS[date.getDay()]} · ${MONTHS[date.getMonth()]} ${date.getDate()}`,
    week: `WK ${toIsoWeek(date)}`,
    rows: collapseLikes(rows),
  }));
};
