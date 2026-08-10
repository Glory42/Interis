import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { ModalShell } from "@/components/ui/ModalShell";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ProfileReviewCommentsSection } from "@/features/reviews/components/profile-review-detail/ProfileReviewCommentsSection";
import { ProfileReviewSection } from "@/features/reviews/components/profile-review-detail/ProfileReviewSection";
import {
  useAddReviewComment,
  useLikeReview,
  useReviewComments,
  useReviewDetail,
  useUnlikeReview,
} from "@/features/reviews/hooks/useReviews";
import { runDialogSubmit } from "@/lib/fire-and-forget";

type ReviewActivityDialogProps = {
  reviewId: string;
  reviewOwnerUsername: string;
  isOpen: boolean;
  onClose: () => void;
};

// Lets a review be read and commented on inline from the feed, without
// leaving for the full /reviews/$username/$reviewId page — mirrors
// PostActivityDialog's "view" mode, reusing the same detail-page comment
// section so the two surfaces never drift apart.
export const ReviewActivityDialog = ({
  reviewId,
  reviewOwnerUsername,
  isOpen,
  onClose,
}: ReviewActivityDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [commentDraft, setCommentDraft] = useState("");
  const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false);

  const detailQuery = useReviewDetail(reviewOwnerUsername, reviewId, isOpen);
  const detail = detailQuery.data;
  const mediaType = detail?.mediaType ?? "movie";

  const commentsQuery = useReviewComments(reviewId, mediaType, Boolean(isOpen && detail));
  const addCommentMutation = useAddReviewComment(reviewId, mediaType);
  const likeReviewMutation = useLikeReview(reviewId);
  const unlikeReviewMutation = useUnlikeReview(reviewId);

  if (!isOpen) {
    return null;
  }

  const likeBusy = likeReviewMutation.isPending || unlikeReviewMutation.isPending;
  const comments = commentsQuery.data ?? [];

  const goToLogin = async () => {
    const redirectPath = `${window.location.pathname}${window.location.search}`;
    await navigate({ to: "/login", search: { redirect: redirectPath } });
  };

  const toggleLike = () =>
    runDialogSubmit(async () => {
      if (likeBusy || !detail) {
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

  return (
    <ModalShell
      onClose={onClose}
      containerClassName="max-w-2xl px-4 py-6 sm:py-10"
      ariaCloseLabel="Close review dialog"
    >
        <section className="theme-modal-panel relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden border border-border/80 bg-card/95 animate-fade-up">
          <div className="flex items-start justify-between border-b border-border/70 px-4 py-3">
            <div className="min-w-0">
              <p className="theme-kicker text-[10px] text-muted-foreground">Review thread</p>
              <p className="truncate text-sm font-semibold text-foreground">
                {detail?.media.title ?? "Loading…"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close review dialog"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto px-4 py-4">
            {detailQuery.isPending ? (
              <p className="text-xs text-muted-foreground">Loading review…</p>
            ) : null}

            {detailQuery.isError || !detail ? (
              <p className="text-xs text-destructive">Could not load this review.</p>
            ) : (
              <>
                <ProfileReviewSection
                  detail={detail}
                  canReadSpoiler={!detail.containsSpoilers || isSpoilerRevealed}
                  onRevealSpoiler={() => setIsSpoilerRevealed(true)}
                  likeBusy={likeBusy}
                  onToggleLike={toggleLike}
                  showReportAction={false}
                  onReport={() => {}}
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
              </>
            )}
          </div>
        </section>
    </ModalShell>
  );
};
