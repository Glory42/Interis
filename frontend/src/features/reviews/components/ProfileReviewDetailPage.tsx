import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { formatRatingOutOfFiveLabel } from "@/features/films/components/spaceRating.utils";
import { ProfileReviewCommentsSection } from "@/features/reviews/components/profile-review-detail/ProfileReviewCommentsSection";
import { ProfileReviewDetailHero } from "@/features/reviews/components/profile-review-detail/ProfileReviewDetailHero";
import {
  ProfileReviewDetailError,
  ProfileReviewDetailPending,
} from "@/features/reviews/components/profile-review-detail/ProfileReviewDetailStatus";
import { ProfileReviewSection } from "@/features/reviews/components/profile-review-detail/ProfileReviewSection";
import { ProfileReviewSidebar } from "@/features/reviews/components/profile-review-detail/ProfileReviewSidebar";
import {
  useAddReviewComment,
  useLikeReview,
  useReviewComments,
  useReviewDetail,
  useUnlikeReview,
} from "@/features/reviews/hooks/useReviews";

type ProfileReviewDetailPageProps = {
  username: string;
  reviewId: string;
};

export function ProfileReviewDetailPage({
  username,
  reviewId,
}: ProfileReviewDetailPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [commentDraft, setCommentDraft] = useState("");
  const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false);

  const detailQuery = useReviewDetail(
    username,
    reviewId,
    username.trim().length > 0,
  );
  const mediaType = detailQuery.data?.mediaType ?? "movie";

  const commentsQuery = useReviewComments(
    reviewId,
    mediaType,
    Boolean(detailQuery.data),
  );
  const addCommentMutation = useAddReviewComment(reviewId, mediaType);
  const likeReviewMutation = useLikeReview(reviewId);
  const unlikeReviewMutation = useUnlikeReview(reviewId);

  if (detailQuery.isPending) {
    return <ProfileReviewDetailPending />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return <ProfileReviewDetailError />;
  }

  const detail = detailQuery.data;
  const canReadSpoiler = !detail.containsSpoilers || isSpoilerRevealed;
  const displayAuthorName =
    detail.author.displayUsername ?? detail.author.username;
  const authorAvatar = detail.author.avatarUrl ?? detail.author.image;
  const likeBusy =
    likeReviewMutation.isPending || unlikeReviewMutation.isPending;
  const comments = commentsQuery.data ?? [];
  const ratingLabel = formatRatingOutOfFiveLabel(detail.ratingOutOfFive);
  const mediaCreditParts = [
    detail.media.releaseYear ? String(detail.media.releaseYear) : null,
    detail.media.director,
    detail.media.creator,
  ].filter((part): part is string => part !== null && part.trim().length > 0);

  const goToLogin = async () => {
    const redirectPath = `${window.location.pathname}${window.location.search}`;
    await navigate({
      to: "/login",
      search: { redirect: redirectPath },
    });
  };

  const toggleLike = async () => {
    if (likeBusy) {
      return;
    }

    if (!user) {
      await goToLogin();
      return;
    }

    if (detail.engagement.viewerHasLiked) {
      await unlikeReviewMutation.mutateAsync();
      return;
    }

    await likeReviewMutation.mutateAsync();
  };

  const submitComment = async () => {
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

  return (
    <div className="min-h-screen">
      <ProfileReviewDetailHero
        username={username}
        detail={detail}
        displayAuthorName={displayAuthorName}
        authorAvatar={authorAvatar}
        mediaCreditParts={mediaCreditParts}
        ratingLabel={ratingLabel}
      />

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 pb-16 pt-14 sm:pt-16 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <ProfileReviewSection
            detail={detail}
            canReadSpoiler={canReadSpoiler}
            onRevealSpoiler={() => setIsSpoilerRevealed(true)}
            likeBusy={likeBusy}
            onToggleLike={toggleLike}
          />

          <ProfileReviewCommentsSection
            detail={detail}
            comments={comments}
            commentsPending={commentsQuery.isPending}
            commentsError={commentsQuery.isError}
            commentDraft={commentDraft}
            onCommentDraftChange={setCommentDraft}
            addCommentPending={addCommentMutation.isPending}
            addCommentError={addCommentMutation.isError}
            onSubmitComment={submitComment}
          />
        </div>

        <ProfileReviewSidebar detail={detail} />
      </div>
    </div>
  );
}
