import type { FeedItem } from "@/features/feed/types";
import {
  ReviewActivityCommentsSection,
  ReviewActivityContent,
  ReviewActivityFooter,
  ReviewActivityHeader,
  ReviewActivityMoviePreview,
} from "./review-activity-card/ReviewActivityCardSections";
import { useReviewActivityCard } from "./review-activity-card/useReviewActivityCard";

type ReviewActivityCardProps = {
  item: FeedItem;
};

export const ReviewActivityCard = ({ item }: ReviewActivityCardProps) => {
  const {
    user,
    actorName,
    actorAvatar,
    actorInitial,
    createdAt,
    reviewContent,
    reviewContainsSpoilers,
    movie,
    itemId,
    ratingOutOfFive,
    filledStars,
    isCommentsOpen,
    commentDraft,
    comments,
    isCommentsLoading,
    isCommentsError,
    commentCount,
    likeCount,
    viewerHasLiked,
    isLikePending,
    isCommentSubmitting,
    commentSubmitError,
    hasReviewId,
    toggleComments,
    toggleLike,
    updateCommentDraft,
    submitComment,
    goToLogin,
  } = useReviewActivityCard(item);

  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-card/76 transition-all duration-300 hover:border-border">
      <ReviewActivityHeader
        actorName={actorName}
        actorUsername={item.actor.username}
        actorAvatar={actorAvatar}
        actorInitial={actorInitial}
        createdAt={createdAt}
        movieTmdbId={movie?.tmdbId ?? null}
      />

      <ReviewActivityContent
        containsSpoilers={reviewContainsSpoilers}
        reviewContent={reviewContent}
      />

      {movie ? (
        <ReviewActivityMoviePreview
          itemId={itemId}
          movie={movie}
          ratingOutOfFive={ratingOutOfFive}
          filledStars={filledStars}
        />
      ) : null}

      <ReviewActivityFooter
        hasReviewId={hasReviewId}
        commentCount={commentCount}
        likeCount={likeCount}
        viewerHasLiked={viewerHasLiked}
        isLikePending={isLikePending}
        movieTmdbId={movie?.tmdbId ?? null}
        onToggleComments={toggleComments}
        onToggleLike={() => {
          void toggleLike();
        }}
      />

      <ReviewActivityCommentsSection
        isOpen={isCommentsOpen}
        isLoading={isCommentsLoading}
        isError={isCommentsError}
        comments={comments}
        isAuthenticated={Boolean(user)}
        commentDraft={commentDraft}
        isSubmittingComment={isCommentSubmitting}
        submitCommentError={commentSubmitError}
        onCommentDraftChange={updateCommentDraft}
        onSubmitComment={() => {
          void submitComment();
        }}
        onGoToLogin={() => {
          void goToLogin();
        }}
      />
    </article>
  );
};
