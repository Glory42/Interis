import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FeedReviewEditDialog } from "@/features/feed/components/FeedReviewEditDialog";
import { formatRatingLabel } from "@/lib/rating";
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
import { useDeleteReview } from "@/features/reviews/hooks/useDeleteReview";
import { ReportContentDialog } from "@/features/reports/components/ReportContentDialog";
import { runDialogSubmit } from "@/lib/fire-and-forget";

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
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
  const deleteReviewMutation = useDeleteReview();

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
  const authorAvatar = detail.author.avatarUrl;
  const isOwnReview =
    user !== null &&
    user.username.toLowerCase() === detail.author.username.toLowerCase();
  const likeBusy =
    likeReviewMutation.isPending || unlikeReviewMutation.isPending;
  const comments = commentsQuery.data ?? [];
  const ratingLabel = formatRatingLabel(detail.rating);
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

  const toggleLike = () =>
    runDialogSubmit(async () => {
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
    });

  const submitComment = () =>
    runDialogSubmit(async () => {
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
    });

  const handleDelete = () =>
    runDialogSubmit(async () => {
      await deleteReviewMutation.mutateAsync({
        id: reviewId,
        mediaType: detail.mediaType,
        tmdbId: detail.media.tmdbId,
      });
      await navigate({ to: "/profile/$username/reviews", params: { username } });
    });

  const handleReport = () =>
    runDialogSubmit(async () => {
      if (!user) {
        await goToLogin();
        return;
      }

      setIsReportDialogOpen(true);
    });

  return (
    <div className="min-h-screen">
      <ReportContentDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        targetType="review"
        targetId={reviewId}
      />

      {isOwnReview ? (
        <>
          <FeedReviewEditDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            reviewId={reviewId}
            initialContent={detail.content}
            containsSpoilers={detail.containsSpoilers}
          />
          <ConfirmDialog
            isOpen={isDeleteDialogOpen}
            title="Delete this review?"
            description="Its likes and comments go with it. This can't be undone."
            confirmLabel="Delete"
            loadingLabel="Deleting"
            isDestructive
            isConfirming={deleteReviewMutation.isPending}
            onConfirm={() => {
              void handleDelete();
            }}
            onClose={() => setIsDeleteDialogOpen(false)}
          >
            {deleteReviewMutation.isError ? (
              <p className="mt-2 text-xs text-destructive">
                {deleteReviewMutation.error instanceof Error
                  ? deleteReviewMutation.error.message
                  : "Could not delete review."}
              </p>
            ) : null}
          </ConfirmDialog>
        </>
      ) : null}

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
            showReportAction={!isOwnReview}
            onReport={() => {
              void handleReport();
            }}
            ownerActions={
              isOwnReview
                ? {
                    onEdit: () => setIsEditDialogOpen(true),
                    onDelete: () => setIsDeleteDialogOpen(true),
                  }
                : undefined
            }
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
