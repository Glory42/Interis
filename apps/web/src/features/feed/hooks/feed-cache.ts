import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import type { FeedItem, FeedTitleGroup, GroupedFeedEntry, GroupedFeedPage } from "@/features/feed/types";
import { restoreQueries, type QuerySnapshot } from "@/lib/query-optimistic";

// What a change is about: one Review, Post or Comment, wherever the feed shows it.
export type FeedTarget =
  | { review: string }
  | { post: string }
  | { comment: string };

export type FeedChange =
  | { type: "liked" }
  | { type: "unliked" }
  | { type: "comment-added" }
  | { type: "comment-removed" }
  | { type: "review-edited"; content: string; containsSpoilers: boolean }
  | { type: "review-deleted" }
  | { type: "post-edited"; content: string }
  | { type: "comment-edited"; content: string };

type GroupedFeedData = InfiniteData<GroupedFeedPage, string | undefined>;
type Engagement = FeedItem["engagement"];

// Mirrors the API's ACTIVITY_EXCERPT_LENGTH, so a patched excerpt matches the refetched one.
const EXCERPT_LENGTH = 120;
const toExcerpt = (content: string) => content.slice(0, EXCERPT_LENGTH);

// Kinds whose metadata.excerpt quotes the review itself, not a comment on it.
const REVIEW_TEXT_KINDS = new Set(["review", "liked_review", "diary_entry"]);
const COMMENT_KINDS = new Set(["commented", "commented_post"]);

const itemMatches = (item: FeedItem, target: FeedTarget): boolean => {
  if ("review" in target) return item.review?.id === target.review || item.metadata.reviewId === target.review;
  if ("post" in target) return item.post?.id === target.post || item.metadata.postId === target.post;
  return item.metadata.commentId === target.comment && COMMENT_KINDS.has(item.kind);
};

const groupMatches = (group: FeedTitleGroup, target: FeedTarget): boolean =>
  "review" in target && group.review?.id === target.review;

const patchEngagement = (engagement: Engagement, change: FeedChange): Engagement => {
  switch (change.type) {
    case "liked":
      return engagement.viewerHasLiked
        ? engagement
        : { ...engagement, viewerHasLiked: true, likeCount: engagement.likeCount + 1 };
    case "unliked":
      return engagement.viewerHasLiked
        ? { ...engagement, viewerHasLiked: false, likeCount: Math.max(engagement.likeCount - 1, 0) }
        : engagement;
    case "comment-added":
      return { ...engagement, commentCount: engagement.commentCount + 1 };
    case "comment-removed":
      return { ...engagement, commentCount: Math.max(engagement.commentCount - 1, 0) };
    default:
      return engagement;
  }
};

// Returns null when the change removes the item from the feed.
const patchItem = (item: FeedItem, change: FeedChange): FeedItem | null => {
  switch (change.type) {
    case "review-edited":
      return {
        ...item,
        review: item.review
          ? { ...item.review, content: change.content, containsSpoilers: change.containsSpoilers }
          : item.review,
        metadata: REVIEW_TEXT_KINDS.has(item.kind)
          ? { ...item.metadata, excerpt: toExcerpt(change.content), containsSpoilers: change.containsSpoilers }
          : item.metadata,
      };
    case "review-deleted":
      // A log outlives its review; every other review activity goes with it.
      if (item.kind !== "diary_entry") return null;
      return {
        ...item,
        review: null,
        metadata: { ...item.metadata, hasReview: false, reviewId: null, excerpt: null, containsSpoilers: null },
      };
    case "post-edited":
      return {
        ...item,
        post: item.post ? { ...item.post, content: change.content } : item.post,
        metadata:
          item.kind === "commented_post" ? item.metadata : { ...item.metadata, excerpt: toExcerpt(change.content) },
      };
    case "comment-edited":
      return { ...item, metadata: { ...item.metadata, excerpt: toExcerpt(change.content) } };
    default:
      return { ...item, engagement: patchEngagement(item.engagement, change) };
  }
};

const patchGroup = (group: FeedTitleGroup, change: FeedChange): FeedTitleGroup => {
  switch (change.type) {
    case "review-edited":
      return group.review
        ? { ...group, review: { ...group.review, content: change.content, containsSpoilers: change.containsSpoilers } }
        : group;
    case "review-deleted":
      return { ...group, review: null, engagement: { likeCount: 0, commentCount: 0, viewerHasLiked: null } };
    default:
      return { ...group, engagement: patchEngagement(group.engagement, change) };
  }
};

const patchEntry = (entry: GroupedFeedEntry, target: FeedTarget, change: FeedChange): GroupedFeedEntry | null => {
  if (entry.kind === "title") {
    return groupMatches(entry, target) ? patchGroup(entry, change) : entry;
  }
  if (!itemMatches(entry.item, target)) return entry;
  const item = patchItem(entry.item, change);
  return item ? { kind: "activity", item } : null;
};

export type FeedSnapshot = QuerySnapshot;

// Applies one change to every cached grouped-feed page (every filter) where the
// target shows, and returns the snapshot `restoreFeed` rolls back to.
export const patchFeed = async (
  queryClient: QueryClient,
  target: FeedTarget,
  change: FeedChange,
): Promise<FeedSnapshot> => {
  const filter = { queryKey: feedKeys.groupedRoot };
  // A refetch landing after the patch would overwrite it.
  await queryClient.cancelQueries(filter);
  const snapshot = queryClient.getQueriesData<GroupedFeedData>(filter);

  queryClient.setQueriesData<GroupedFeedData>(filter, (old) =>
    old
      ? {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.flatMap((entry) => patchEntry(entry, target, change) ?? []),
          })),
        }
      : old,
  );

  return snapshot;
};

export const restoreFeed = (queryClient: QueryClient, snapshot: FeedSnapshot | undefined): void => {
  restoreQueries(queryClient, snapshot ?? []);
};

// Refetches the Following Feed, every filter; the other feed queries are left alone.
export const invalidateFollowingFeed = (queryClient: QueryClient): Promise<void> =>
  queryClient.invalidateQueries({ queryKey: feedKeys.groupedRoot });
