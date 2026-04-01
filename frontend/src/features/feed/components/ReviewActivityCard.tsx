import type { FeedItem } from "@/features/feed/types";
import {
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
    isSpoilerRevealed,
    commentCount,
    likeCount,
    viewerHasLiked,
    isLikePending,
    hasReviewId,
    openReview,
    openReviewFromAction,
    revealSpoilers,
    toggleLike,
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
        movieMediaType={movie?.mediaType ?? null}
      />

      <ReviewActivityContent
        containsSpoilers={reviewContainsSpoilers}
        isSpoilerRevealed={isSpoilerRevealed}
        reviewContent={reviewContent}
        onRevealSpoilers={revealSpoilers}
        onOpenReview={() => {
          void openReview();
        }}
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
        movieMediaType={movie?.mediaType ?? null}
        onOpenReview={() => {
          void openReviewFromAction();
        }}
        onToggleLike={() => {
          void toggleLike();
        }}
      />
    </article>
  );
};
