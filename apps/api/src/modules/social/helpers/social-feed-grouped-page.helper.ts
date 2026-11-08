import { countVisibleRows, toUtcDayKey } from "./social-feed-grouping.helper";
import type { ActivityRow, GroupedFeedEntry } from "../types/social-feed.types";

export type GroupedPageCut = {
  items: GroupedFeedEntry[];
  // The last raw row the page covers; the next page starts after it.
  lastRow: ActivityRow | undefined;
  coversAllRows: boolean;
};

const entryDay = (entry: GroupedFeedEntry): string =>
  toUtcDayKey(entry.kind === "title" ? entry.createdAt : entry.item.createdAt);

// Keeps whole days, newest first, until about `limit` rows would show. `openDay`
// continues past the rows read, so it is left for the next page unless it's
// the only day (then the page ends mid-day).
export const cutGroupedPage = (
  rows: ActivityRow[],
  entries: GroupedFeedEntry[],
  limit: number,
  openDay: string | null,
): GroupedPageCut => {
  const entriesByDay = new Map<string, GroupedFeedEntry[]>();
  for (const entry of entries) {
    const day = entryDay(entry);
    entriesByDay.set(day, [...(entriesByDay.get(day) ?? []), entry]);
  }

  const days = [...new Set(rows.map((row) => toUtcDayKey(row.activity.createdAt)))];
  const keptDays = new Set<string>();
  let visibleRows = 0;
  for (const [index, day] of days.entries()) {
    if (day === openDay && index > 0) break;
    keptDays.add(day);
    visibleRows += countVisibleRows(entriesByDay.get(day) ?? []);
    if (visibleRows >= limit) break;
  }

  const keptRows = rows.filter((row) => keptDays.has(toUtcDayKey(row.activity.createdAt)));
  return {
    items: entries.filter((entry) => keptDays.has(entryDay(entry))),
    lastRow: keptRows.at(-1),
    coversAllRows: keptRows.length === rows.length,
  };
};
