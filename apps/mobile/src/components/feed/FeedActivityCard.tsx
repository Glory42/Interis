import { memo } from "react";
import type { FeedItem } from "@/types/feed";
import { PostActivityCard } from "./PostActivityCard";
import { ReviewActivityCard } from "./ReviewActivityCard";
import { TimelineActivityCard } from "./TimelineActivityCard";
import { isPostKind, isReviewKind } from "./feed.utils";

type FeedActivityCardProps = {
  item: FeedItem;
  onToggleReviewLike: (reviewId: string, liked: boolean) => void;
};

export const FeedActivityCard = memo(function FeedActivityCard({
  item,
  onToggleReviewLike,
}: FeedActivityCardProps) {
  if (isPostKind(item)) {
    return <PostActivityCard item={item} />;
  }

  if (isReviewKind(item)) {
    return <ReviewActivityCard item={item} onToggleLike={onToggleReviewLike} />;
  }

  return <TimelineActivityCard item={item} />;
});
