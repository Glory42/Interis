import { FEED_KINDS } from "./feed-kinds/feed-kind.registry";
import type {
  FeedItem,
  FeedTitleGroup,
  GroupedFeedEntry,
} from "../types/social-feed.types";

export const toUtcDayKey = (date: Date): string => date.toISOString().slice(0, 10);

const isLikeOfOwnContent = (item: FeedItem): boolean =>
  FEED_KINDS[item.kind].isLike === true && item.metadata.targetUsername === item.actor.username;

const groupKey = (item: FeedItem): string | null => {
  if (!item.movie || !FEED_KINDS[item.kind].joinTitleGroup) {
    return null;
  }

  return [
    item.actor.id,
    item.movie.mediaType,
    item.movie.tmdbId,
    item.metadata.seasonNumber ?? "",
    item.metadata.episodeNumber ?? "",
    toUtcDayKey(new Date(item.createdAt)),
  ].join(":");
};

const startGroup = (item: FeedItem): FeedTitleGroup => ({
  kind: "title",
  id: item.id,
  createdAt: item.createdAt,
  actor: item.actor,
  movie: item.movie!,
  seasonNumber: item.metadata.seasonNumber,
  episodeNumber: item.metadata.episodeNumber,
  watched: false,
  rewatch: false,
  rating: null,
  liked: false,
  watchlisted: false,
  review: null,
  log: null,
  engagement: item.engagement,
  itemIds: [],
});

// Items arrive newest first, so the first value seen for a field is the latest one.
const addToGroup = (group: FeedTitleGroup, item: FeedItem): void => {
  group.itemIds.push(item.id);
  FEED_KINDS[item.kind].joinTitleGroup?.(group, item);
  group.rating ??= item.metadata.rating ?? item.review?.rating ?? null;

  if (!group.review && item.review) {
    group.review = item.review;
    group.engagement = item.engagement;
  }
};

export const groupFeedItems = (items: FeedItem[]): GroupedFeedEntry[] => {
  const entries: GroupedFeedEntry[] = [];
  const groupsByKey = new Map<string, FeedTitleGroup>();

  for (const item of items) {
    if (isLikeOfOwnContent(item)) {
      continue;
    }

    const key = groupKey(item);
    if (!key) {
      entries.push({ kind: "activity", item });
      continue;
    }

    let group = groupsByKey.get(key);
    if (!group) {
      group = startGroup(item);
      groupsByKey.set(key, group);
      entries.push(group);
    }
    addToGroup(group, item);
  }

  return entries;
};

const isOnly = (group: FeedTitleGroup, action: "liked" | "watchlisted"): boolean =>
  group[action] &&
  !(action === "liked" ? group.watchlisted : group.liked) &&
  !group.watched &&
  group.rating === null &&
  !group.review;

// Back-to-back entries sharing a key show as one row on the web (a same-day run
// of one person's likes, watchlist adds, follows, or one show's seasons and
// episodes). Mirrors foldKey in the web's feed-days.ts.
const foldKey = (entry: GroupedFeedEntry): string | null => {
  if (entry.kind === "activity") {
    const { item } = entry;
    return item.kind === "followed_user" ? `follows:${item.actor.id}:${toUtcDayKey(item.createdAt)}` : null;
  }
  const scope = `${entry.actor.id}:${toUtcDayKey(entry.createdAt)}`;
  if (entry.seasonNumber !== null && !entry.review) {
    return `episodes:${scope}:${entry.movie.mediaType}:${entry.movie.tmdbId}`;
  }
  if (isOnly(entry, "liked")) return `liked:${scope}`;
  if (isOnly(entry, "watchlisted")) return `watchlisted:${scope}`;
  return null;
};

// Where each row the web shows ends.
const visibleRowEnds = (entries: GroupedFeedEntry[]): number[] => {
  const ends: number[] = [];
  let index = 0;
  while (index < entries.length) {
    const key = foldKey(entries[index]!);
    index += 1;
    while (key !== null && index < entries.length && foldKey(entries[index]!) === key) index += 1;
    ends.push(index);
  }
  return ends;
};

export const countVisibleRows = (entries: GroupedFeedEntry[]): number => visibleRowEnds(entries).length;

export const takeVisibleRows = (entries: GroupedFeedEntry[], limit: number): GroupedFeedEntry[] =>
  limit > 0 ? entries.slice(0, visibleRowEnds(entries)[limit - 1] ?? entries.length) : [];
