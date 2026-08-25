import type { FeedItem, FeedMediaType } from "../types/social-feed.types";

// Mirrors the frontend's inferFeedChannel (feed-row.utils.ts) so the
// server-side media-type filter and the client's own channel badges never
// drift apart.
export const inferFeedItemMediaType = (item: FeedItem): FeedMediaType | null => {
  if (item.movie?.mediaType === "movie") return "movie";
  if (item.movie?.mediaType === "tv") return "tv";
  if (item.metadata.mediaType === "movie") return "movie";
  if (item.metadata.mediaType === "tv") return "tv";

  const attachedMediaType = item.post?.mediaType ?? item.metadata.postMediaType;
  if (attachedMediaType === "movie") return "movie";
  if (attachedMediaType === "tv") return "tv";

  return null;
};
