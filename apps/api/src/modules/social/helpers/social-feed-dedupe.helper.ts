import type { FeedItem } from "../types/social-feed.types";

const isReviewDuplicateCandidate = (item: FeedItem) => {
  return item.review !== null && (item.kind === "review" || item.kind === "diary_entry");
};

const toReviewDuplicateKey = (item: FeedItem) => {
  return `${item.actor.id}:${item.review?.id ?? ""}`;
};

const shouldPreferCandidate = (existing: FeedItem, candidate: FeedItem) => {
  if (candidate.kind === "diary_entry" && existing.kind !== "diary_entry") {
    return true;
  }

  return false;
};

export const dedupeReviewFeedItems = (items: FeedItem[]): FeedItem[] => {
  const preferredByReviewKey = new Map<string, FeedItem>();

  for (const item of items) {
    if (!isReviewDuplicateCandidate(item)) {
      continue;
    }

    const duplicateKey = toReviewDuplicateKey(item);
    const existing = preferredByReviewKey.get(duplicateKey);

    if (!existing || shouldPreferCandidate(existing, item)) {
      preferredByReviewKey.set(duplicateKey, item);
    }
  }

  return items.filter((item) => {
    if (!isReviewDuplicateCandidate(item)) {
      return true;
    }

    const preferred = preferredByReviewKey.get(toReviewDuplicateKey(item));
    return preferred ? preferred.id === item.id : true;
  });
};
