import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { FeedItem } from "@/features/feed/types";
import type { ReviewComment } from "@/features/reviews/api";
import {
  useAddReviewComment,
  useLikeReview,
  useReviewComments,
  useUnlikeReview,
} from "@/features/reviews/hooks/useReviews";
import {
  getRatingOutOfFive,
  getRoundedStarCount,
} from "./reviewActivityCard.utils";

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
  isCommentsOpen: boolean;
  commentDraft: string;
  comments: ReviewComment[];
  isCommentsLoading: boolean;
  isCommentsError: boolean;
  commentCount: number;
  likeCount: number;
  viewerHasLiked: boolean;
  isLikePending: boolean;
  isCommentSubmitting: boolean;
  commentSubmitError: string | null;
  hasReviewId: boolean;
  toggleComments: () => void;
  toggleLike: () => Promise<void>;
  updateCommentDraft: (value: string) => void;
  submitComment: () => Promise<void>;
  goToLogin: () => Promise<void>;
};

export const useReviewActivityCard = (item: FeedItem): ReviewActivityCardViewModel => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");

  const reviewId = item.review?.id ?? item.metadata.reviewId ?? "";
  const hasReviewId = reviewId.length > 0;

  const reviewCommentsQuery = useReviewComments(reviewId, hasReviewId && isCommentsOpen);
  const addCommentMutation = useAddReviewComment(reviewId);
  const likeReviewMutation = useLikeReview(reviewId);
  const unlikeReviewMutation = useUnlikeReview(reviewId);

  const actorName = item.actor.displayUsername ?? item.actor.username;
  const actorAvatar = item.actor.avatarUrl ?? item.actor.image ?? null;
  const actorInitial = item.actor.username.slice(0, 1).toUpperCase();

  const reviewContent = item.review?.content ?? item.metadata.excerpt ?? "";
  const reviewContainsSpoilers = item.review?.containsSpoilers === true;

  const isLikePending = likeReviewMutation.isPending || unlikeReviewMutation.isPending;

  const comments = reviewCommentsQuery.data ?? [];
  const commentCount = reviewCommentsQuery.data?.length ?? item.engagement.commentCount;
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

  const submitComment = async () => {
    if (!hasReviewId) {
      return;
    }

    const normalizedContent = commentDraft.trim();
    if (normalizedContent.length === 0 || addCommentMutation.isPending) {
      return;
    }

    if (!user) {
      await goToLogin();
      return;
    }

    await addCommentMutation.mutateAsync({ content: normalizedContent });
    setCommentDraft("");
  };

  const updateCommentDraft = (value: string) => {
    if (value.length <= 2000) {
      setCommentDraft(value);
    }
  };

  const toggleComments = () => {
    if (hasReviewId) {
      setIsCommentsOpen((current) => !current);
    }
  };

  const commentSubmitError = addCommentMutation.isError
    ? addCommentMutation.error instanceof Error
      ? addCommentMutation.error.message
      : "Could not send comment."
    : null;

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
    isCommentsOpen,
    commentDraft,
    comments,
    isCommentsLoading: reviewCommentsQuery.isPending,
    isCommentsError: reviewCommentsQuery.isError,
    commentCount,
    likeCount,
    viewerHasLiked,
    isLikePending,
    isCommentSubmitting: addCommentMutation.isPending,
    commentSubmitError,
    hasReviewId,
    toggleComments,
    toggleLike,
    updateCommentDraft,
    submitComment,
    goToLogin,
  };
};
