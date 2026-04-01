import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { FeedItem } from "@/features/feed/types";
import type { ReviewMediaType } from "@/features/reviews/api";
import { useLikeReview, useUnlikeReview } from "@/features/reviews/hooks/useReviews";
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
  const reviewMediaType =
    (item.movie?.mediaType ?? item.metadata.mediaType ?? "movie") as ReviewMediaType;
  const hasReviewId = reviewId.length > 0;

  const likeReviewMutation = useLikeReview(reviewId, reviewMediaType);
  const unlikeReviewMutation = useUnlikeReview(reviewId, reviewMediaType);

  const actorName = item.actor.displayUsername ?? item.actor.username;
  const actorAvatar = item.actor.avatarUrl ?? item.actor.image ?? null;
  const actorInitial = item.actor.username.slice(0, 1).toUpperCase();

  const reviewContent = item.review?.content ?? item.metadata.excerpt ?? "";
  const reviewContainsSpoilers = item.review?.containsSpoilers === true;
  const reviewOwnerUsername = item.actor.username;

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

    await navigate({
      to: "/reviews/$username/$reviewId",
      params: {
        username: reviewOwnerUsername,
        reviewId,
      },
      viewTransition: true,
    });
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
