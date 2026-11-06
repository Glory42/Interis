import type {
  FeedItem,
  FeedTitleGroup,
  GroupedFeedEntry,
} from "../types/social-feed.types";

const TITLE_ACTIVITY_TYPES = new Set(["diary_entry", "review", "liked_movie", "watchlisted_movie"]);
const LIKE_KINDS = new Set(["liked_review", "liked_comment", "liked_post"]);

export const toUtcDayKey = (date: Date): string => date.toISOString().slice(0, 10);

const isLikeOfOwnContent = (item: FeedItem): boolean =>
  LIKE_KINDS.has(item.kind) && item.metadata.targetUsername === item.actor.username;

const groupKey = (item: FeedItem): string | null => {
  if (!item.movie || !TITLE_ACTIVITY_TYPES.has(item.type)) {
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
  engagement: item.engagement,
  itemIds: [],
});

// Items arrive newest first, so the first value seen for a field is the latest one.
const addToGroup = (group: FeedTitleGroup, item: FeedItem): void => {
  group.itemIds.push(item.id);

  if (item.type === "diary_entry") {
    group.watched = true;
    group.rewatch = group.rewatch || item.metadata.rewatch === true;
  }

  // Ratings are recorded as liked_movie rows that carry a rating.
  const isRating = item.type === "liked_movie" && item.metadata.rating !== null;
  if (item.type === "liked_movie" && !isRating) {
    group.liked = true;
  }
  if (item.type === "watchlisted_movie") {
    group.watchlisted = true;
  }

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
