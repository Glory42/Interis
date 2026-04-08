import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { FeedItem } from "@/features/feed/types";
import { useLikeReview, useUnlikeReview } from "@/features/reviews/hooks/useReviews";
import { navigateWithViewTransitionFallback } from "@/lib/view-transition";
import { getRatingOutOfFive, getRoundedStarCount } from "./reviewActivityCard.utils";

type ReviewActivityCardViewModel = {
  user: ReturnType<typeof useAuth>["user"];
  actorName: string;
  actorAvatar: string | null;
  actorInitial: string;
  createdAt: string;
  reviewContent: string;
  reviewContainsSpoilers: boolean;
  movie: FeedItem["movie"];
  itemId: string;
  ratingOutOfFive: string | null;
  filledStars: number;
  commentCount: number;
  likeCount: number;
  viewerHasLiked: boolean;
  isLikePending: boolean;
  hasReviewId: boolean;
  isSpoilerRevealed: boolean;
  openReview: () => Promise<void>;
  openReviewFromAction: () => Promise<void>;
  revealSpoilers: () => void;
  toggleLike: () => Promise<void>;
  goToLogin: () => Promise<void>;
};

export const useReviewActivityCard = (item: FeedItem): ReviewActivityCardViewModel => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false);

  const reviewId = item.review?.id ?? item.metadata.reviewId ?? "";
  const hasReviewId = reviewId.length > 0;

  const likeReviewMutation = useLikeReview(reviewId);
  const unlikeReviewMutation = useUnlikeReview(reviewId);

  const actorName = item.actor.displayUsername ?? item.actor.username;
  const actorAvatar = item.actor.avatarUrl ?? item.actor.image ?? null;
  const actorInitial = item.actor.username.slice(0, 1).toUpperCase();

  const isLikeReviewActivity = item.kind === "liked_review";
  const isCommentActivity = item.kind === "commented";
  const isPrimaryReviewActivity =
    item.kind === "review" || item.kind === "diary_entry";
  const reviewContent = isCommentActivity
    ? item.metadata.excerpt ?? item.review?.content ?? ""
    : isLikeReviewActivity
      ? item.metadata.excerpt ?? ""
      : item.review?.content ?? item.metadata.excerpt ?? "";
  const reviewContainsSpoilers =
    isPrimaryReviewActivity && item.review?.containsSpoilers === true;
  const reviewOwnerUsername = item.metadata.targetUsername ?? item.actor.username;

  const isLikePending = likeReviewMutation.isPending || unlikeReviewMutation.isPending;

  const commentCount = item.engagement.commentCount;
  const likeCount = item.engagement.likeCount;
  const viewerHasLiked = item.engagement.viewerHasLiked === true;

  const ratingOutOfFive = getRatingOutOfFive(item.review?.rating ?? item.metadata.rating);
  const filledStars = useMemo(
    () => getRoundedStarCount(ratingOutOfFive),
    [ratingOutOfFive],
  );

  const goToLogin = async () => {
    const redirectPath = `${window.location.pathname}${window.location.search}`;
    await navigate({
      to: "/login",
      search: { redirect: redirectPath },
    });
  };

  const openReviewRoute = async () => {
    if (!hasReviewId) {
      return;
    }

    await navigateWithViewTransitionFallback(
      () =>
        navigate({
          to: "/reviews/$username/$reviewId",
          params: {
            username: reviewOwnerUsername,
            reviewId,
          },
          viewTransition: true,
        }),
      () =>
        navigate({
          to: "/reviews/$username/$reviewId",
          params: {
            username: reviewOwnerUsername,
            reviewId,
          },
        }),
    );
  };

  const openReview = async () => {
    if (reviewContainsSpoilers && !isSpoilerRevealed) {
      return;
    }

    await openReviewRoute();
  };

  const openReviewFromAction = async () => {
    await openReviewRoute();
  };

  const revealSpoilers = () => {
    setIsSpoilerRevealed(true);
  };

  const toggleLike = async () => {
    if (!hasReviewId || isLikePending) {
      return;
    }

    if (!user) {
      await goToLogin();
      return;
    }

    if (viewerHasLiked) {
      await unlikeReviewMutation.mutateAsync();
      return;
    }

    await likeReviewMutation.mutateAsync();
  };

  return {
    user,
    actorName,
    actorAvatar,
    actorInitial,
    createdAt: item.createdAt,
    reviewContent,
    reviewContainsSpoilers,
    movie: item.movie,
    itemId: item.id,
    ratingOutOfFive,
    filledStars,
    commentCount,
    likeCount,
    viewerHasLiked,
    isLikePending,
    hasReviewId,
    isSpoilerRevealed,
    openReview,
    openReviewFromAction,
    revealSpoilers,
    toggleLike,
    goToLogin,
  };
};
