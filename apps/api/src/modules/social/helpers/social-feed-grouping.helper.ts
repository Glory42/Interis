import { FEED_KINDS } from "./feed-kinds/feed-kind.registry";
import { toDayKey } from "./feed-day.helper";
import type {
  FeedItem,
  FeedTitleGroup,
  GroupedFeedEntry,
} from "../types/social-feed.types";

const groupKey = (item: FeedItem, timeZone: string): string | null => {
  if (!item.movie || !FEED_KINDS[item.kind].joinTitleGroup) {
    return null;
  }

  return [
    item.actor.id,
    item.movie.mediaType,
    item.movie.tmdbId,
    item.metadata.seasonNumber ?? "",
    item.metadata.episodeNumber ?? "",
    toDayKey(item.createdAt, timeZone),
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

// Merges one person's actions on one title on one day (in `timeZone`) into a title group.
export const groupFeedItems = (items: FeedItem[], timeZone: string): GroupedFeedEntry[] => {
  const entries: GroupedFeedEntry[] = [];
  const groupsByKey = new Map<string, FeedTitleGroup>();

  for (const item of items) {
    const key = groupKey(item, timeZone);
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
