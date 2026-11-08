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

const isLikeOnly = (entry: GroupedFeedEntry): entry is FeedTitleGroup =>
  entry.kind === "title" &&
  entry.liked &&
  !entry.watched &&
  entry.rating === null &&
  !entry.review &&
  !entry.watchlisted;

// Where each row the web shows ends: a same-day run of one person's likes
// collapses into a single "liked N titles" row.
const visibleRowEnds = (entries: GroupedFeedEntry[]): number[] => {
  const ends: number[] = [];
  let index = 0;
  while (index < entries.length) {
    const entry = entries[index]!;
    index += 1;
    if (!isLikeOnly(entry)) {
      ends.push(index);
      continue;
    }
    const day = toUtcDayKey(entry.createdAt);
    while (index < entries.length) {
      const next = entries[index]!;
      if (!isLikeOnly(next) || next.actor.id !== entry.actor.id || toUtcDayKey(next.createdAt) !== day) break;
      index += 1;
    }
    ends.push(index);
  }
  return ends;
};

export const countVisibleRows = (entries: GroupedFeedEntry[]): number => visibleRowEnds(entries).length;

export const takeVisibleRows = (entries: GroupedFeedEntry[], limit: number): GroupedFeedEntry[] =>
  limit > 0 ? entries.slice(0, visibleRowEnds(entries)[limit - 1] ?? entries.length) : [];
