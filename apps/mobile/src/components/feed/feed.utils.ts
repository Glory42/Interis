import type { FeedItem } from "@/types/feed";
import type { MediaType } from "@/types/common";

// Ported from apps/web/src/features/feed/components/feed-row.utils.ts and the
// verb helpers in FeedActivityCard / ReviewActivityCard.

export const inferFeedMediaType = (item: FeedItem): MediaType | null =>
  item.movie?.mediaType ??
  item.metadata.mediaType ??
  item.post?.mediaType ??
  item.metadata.postMediaType ??
  null;

export const toSeasonEpisodeLabel = (item: FeedItem): string | null => {
  const { seasonNumber, episodeNumber } = item.metadata;
  if (episodeNumber != null && seasonNumber != null) {
    return `S${seasonNumber}E${episodeNumber}`;
  }
  if (seasonNumber != null) {
    return `Season ${seasonNumber}`;
  }
  return null;
};

export const getTimelineVerb = (item: FeedItem): string => {
  const seLabel = toSeasonEpisodeLabel(item);
  switch (item.kind) {
    case "diary_entry":
      return "Logged a watch";
    case "liked_movie":
      if (seLabel && item.metadata.rating !== null) return `Rated ${seLabel}`;
      return seLabel ? `Liked ${seLabel}` : "Liked a title";
    case "watchlisted_movie":
      return "Added to their watchlist";
    case "followed_user":
      return item.metadata.targetUsername
        ? `Started following @${item.metadata.targetUsername}`
        : "Followed someone";
    case "created_list":
      return "Created a new list";
    case "liked_comment":
      return "Liked a comment";
    default:
      return "Updated their activity";
  }
};

export const getReviewVerbPrefix = (item: FeedItem): string => {
  switch (item.kind) {
    case "review":
      return "Reviewed";
    case "diary_entry":
      return "Logged";
    case "liked_review":
      return item.metadata.targetUsername
        ? `Liked @${item.metadata.targetUsername}'s review of`
        : "Liked a review of";
    case "commented":
      return item.metadata.targetUsername
        ? `Commented on @${item.metadata.targetUsername}'s review of`
        : "Commented on a review of";
    default:
      return "Updated a review of";
  }
};

export const isReviewKind = (item: FeedItem): boolean =>
  item.kind === "review" ||
  item.kind === "liked_review" ||
  item.kind === "commented" ||
  (item.kind === "diary_entry" && item.review !== null);

export const isPostKind = (item: FeedItem): boolean =>
  item.kind === "post" || item.kind === "liked_post" || item.kind === "commented_post";

export const truncateQuote = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
