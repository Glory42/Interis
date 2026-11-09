import { toDayKey } from "./feed-day.helper";
import type { FeedRow, FeedTitleGroup, GroupedFeedEntry } from "../types/social-feed.types";

const entryCreatedAt = (entry: GroupedFeedEntry): Date =>
  entry.kind === "title" ? entry.createdAt : entry.item.createdAt;

const entryId = (entry: GroupedFeedEntry): string => (entry.kind === "title" ? entry.id : entry.item.id);

const isOnly = (group: FeedTitleGroup, action: "liked" | "watchlisted"): boolean =>
  group[action] &&
  !(action === "liked" ? group.watchlisted : group.liked) &&
  !group.watched &&
  group.rating === null &&
  !group.review;

// Back-to-back entries of one day sharing a key fold into one row.
const foldKey = (entry: GroupedFeedEntry, day: string): string | null => {
  if (entry.kind === "activity") {
    return entry.item.kind === "followed_user" ? `follows:${entry.item.actor.id}:${day}` : null;
  }
  const scope = `${entry.actor.id}:${day}`;
  if (entry.seasonNumber !== null && !entry.review) {
    return `episodes:${scope}:${entry.movie.mediaType}:${entry.movie.tmdbId}`;
  }
  if (isOnly(entry, "liked")) return `liked:${scope}`;
  if (isOnly(entry, "watchlisted")) return `watchlisted:${scope}`;
  return null;
};

const toRow = (entry: GroupedFeedEntry, day: string): FeedRow =>
  entry.kind === "title"
    ? { kind: "title", key: entry.id, day, group: entry }
    : { kind: "activity", key: entry.item.id, day, item: entry.item };

const toFoldedRow = (run: GroupedFeedEntry[], day: string): FeedRow => {
  const key = run.map(entryId).join("+");
  const items = run.flatMap((entry) => (entry.kind === "activity" ? [entry.item] : []));
  if (items.length > 0) {
    const usernames = items.flatMap((item) => (item.metadata.targetUsername ? [item.metadata.targetUsername] : []));
    return { kind: "follows", key, day, actor: items[0]!.actor, usernames };
  }
  const groups = run.flatMap((entry) => (entry.kind === "title" ? [entry] : []));
  const first = groups[0]!;
  if (first.seasonNumber !== null) {
    return { kind: "episodes", key, day, actor: first.actor, movie: first.movie, groups };
  }
  const action = first.liked ? "liked" : "watchlisted";
  return { kind: "titles", key, day, action, actor: first.actor, titles: groups.map((group) => group.movie) };
};

// Entries arrive newest first; a same-day run sharing a fold key becomes one row,
// and a run of one keeps its own row.
export const foldFeedEntries = (entries: GroupedFeedEntry[], timeZone: string): FeedRow[] => {
  const days = entries.map((entry) => toDayKey(entryCreatedAt(entry), timeZone));
  const rows: FeedRow[] = [];
  let index = 0;
  while (index < entries.length) {
    const day = days[index]!;
    const key = foldKey(entries[index]!, day);
    let end = index + 1;
    while (key !== null && end < entries.length && foldKey(entries[end]!, days[end]!) === key) end += 1;
    const run = entries.slice(index, end);
    rows.push(run.length > 1 ? toFoldedRow(run, day) : toRow(run[0]!, day));
    index = end;
  }
  return rows;
};
