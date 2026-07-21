import { memo, useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  Heart,
  Loader2,
  MessageSquare,
  PenSquare,
  TriangleAlert,
} from "lucide-react";
import { SpaceRatingDisplay } from "@/features/films/components/SpaceRating";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import { FeedCardHeader } from "@/features/feed/components/FeedCardHeader";
import { FeedReviewEditDialog } from "@/features/feed/components/FeedReviewEditDialog";
import { ReviewActivityDialog } from "@/features/feed/components/ReviewActivityDialog";
import { toSeasonEpisodeLabel, truncateQuote } from "@/features/feed/components/feed-row.utils";
import { getPosterUrl } from "@/features/films/components/utils";
import type { FeedItem } from "@/features/feed/types";
import { cn } from "@/lib/utils";
import { useReviewActivityCard } from "./review-activity-card/useReviewActivityCard";

type ReviewActivityCardProps = {
  item: FeedItem;
};

const AVATAR_GRADIENT = "linear-gradient(135deg, var(--primary), var(--accent))";

// Verb only — the movie title is always rendered separately, as a real
// inline link, right after this. Kinds that reference someone else's
// review ("of") vs. ones that act on the title directly.
const getReviewVerbPrefix = (item: FeedItem): string => {
  switch (item.kind) {
    case "review":
      return "Reviewed";
    case "diary_entry":
      return "Logged";
    case "liked_review":
      return item.metadata.targetUsername
        ? `Liked @${item.metadata.targetUsername}'s review`
        : "Liked a review";
    case "commented":
      return item.metadata.targetUsername
        ? `Commented on @${item.metadata.targetUsername}'s review`
        : "Commented on a review";
    default:
      return "Updated a review";
  }
};

const NEEDS_OF_PREPOSITION_KINDS: FeedItem["kind"][] = ["liked_review", "commented"];

const getReviewBodyFallback = (item: FeedItem): string => {
  if (item.kind === "commented") {
    return "Left a comment on a review.";
  }

  if (item.kind === "liked_review") {
    return "Liked a review.";
  }

  return "Shared a review.";
};

export const ReviewActivityCard = memo(function ReviewActivityCard({
  item,
}: ReviewActivityCardProps) {
  const {
    user,
    actorName,
    actorAvatar,
    actorInitial,
    createdAt,
    reviewContent,
    reviewContainsSpoilers,
    movie,
    rating,
    isSpoilerRevealed,
    commentCount,
    likeCount,
    viewerHasLiked,
    isLikePending,
    hasReviewId,
    reviewOwnerUsername,
    openReview,
    revealSpoilers,
    toggleLike,
  } = useReviewActivityCard(item);

  const seLabel = toSeasonEpisodeLabel(item);
  const ratingValue = rating === null ? null : Number.parseFloat(rating);
  const reviewId = item.review?.id ?? item.metadata.reviewId ?? null;
  const isOwnReview = Boolean(user && reviewId && user.id === item.actor.id);
  const verbPrefix = getReviewVerbPrefix(item);
  const needsOf = NEEDS_OF_PREPOSITION_KINDS.includes(item.kind);
  const showRating = item.kind === "review" || item.kind === "diary_entry";
  const showPoster = showRating && movie?.posterPath;
  const quotedOriginal = item.kind === "commented" ? item.review?.content : null;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);

  const handleRowClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, textarea, input")) {
      return;
    }

    void openReview();
  };

  return (
    <>
      <article
        className="group -mx-2 flex cursor-pointer gap-3 border border-transparent border-b-border/40 px-3 py-4 transition-colors hover:border-border/60 hover:bg-foreground/[0.025]"
        onClick={handleRowClick}
      >
        <FeedActorAvatar
          avatarUrl={actorAvatar}
          username={item.actor.username}
          initial={actorInitial}
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden text-base font-bold text-foreground"
          style={{ background: AVATAR_GRADIENT }}
        />

        <div className="min-w-0 flex-1">
          <FeedCardHeader
            username={item.actor.username}
            displayName={actorName}
            createdAt={createdAt}
          />

          <p className="mt-0.5 text-[15px] leading-snug text-foreground/90">
            {verbPrefix}
            {movie ? (
              <>
                {needsOf ? " of " : " "}
                <Link
                  to={movie.mediaType === "tv" ? "/serials/$tmdbId" : "/cinema/$tmdbId"}
                  params={{ tmdbId: String(movie.tmdbId) }}
                  className="font-bold text-foreground hover:text-primary"
                  style={{ fontFamily: "var(--theme-display-font)" }}
                  viewTransition
                >
                  {movie.title}
                </Link>
              </>
            ) : null}
            {seLabel ? <span className="text-muted-foreground"> · {seLabel}</span> : null}
            {item.metadata.rewatch ? (
              <span className="text-muted-foreground"> · rewatch</span>
            ) : null}
          </p>

          {showRating && rating !== null ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {rating}
                <span className="text-xs font-normal text-muted-foreground">/10</span>
              </span>
              <SpaceRatingDisplay rating={ratingValue} size="sm" />
            </div>
          ) : null}

          {reviewContainsSpoilers && !isSpoilerRevealed ? (
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-2 border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-500/15"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                revealSpoilers();
              }}
            >
              <TriangleAlert className="h-3.5 w-3.5" />
              Contains spoilers — reveal
            </button>
          ) : (
            <p className="mt-2 line-clamp-4 text-[15px] leading-relaxed text-foreground/90 transition-colors group-hover:text-foreground">
              {reviewContent || getReviewBodyFallback(item)}
            </p>
          )}

          {quotedOriginal ? (
            <div className="mt-2 border-l-2 border-border/50 pl-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {item.metadata.targetUsername ? (
                  <>
                    <span className="font-semibold text-foreground/80">
                      @{item.metadata.targetUsername}
                    </span>
                    {movie ? (
                      <>
                        {" "}
                        on <span className="font-medium text-foreground/80">{movie.title}</span>
                      </>
                    ) : null}
                    {" — "}
                  </>
                ) : null}
                "{truncateQuote(quotedOriginal, 140)}"
              </p>
            </div>
          ) : null}

          {showPoster && movie?.posterPath ? (
            <img
              src={getPosterUrl(movie.posterPath)}
              alt={`${movie.title} poster`}
              loading="lazy"
              className="mt-3 h-32 w-[88px] object-cover"
            />
          ) : null}

          <div className="mt-3 flex items-center gap-6 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setIsCommentDialogOpen(true);
              }}
              disabled={!hasReviewId}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MessageSquare className="h-4 w-4" />
              {commentCount}
            </button>
            <button
              type="button"
              onClick={() => {
                void toggleLike();
              }}
              disabled={!hasReviewId || isLikePending}
              className={cn(
                "inline-flex items-center gap-1.5 transition-colors",
                viewerHasLiked ? "text-primary" : "hover:text-primary",
                !hasReviewId || isLikePending ? "cursor-not-allowed opacity-50" : "",
              )}
            >
              {isLikePending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={cn("h-4 w-4", viewerHasLiked ? "fill-current" : "")} />
              )}
              {likeCount}
            </button>

            {isOwnReview && reviewId ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditDialogOpen(true);
                }}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
              >
                <PenSquare className="h-4 w-4" />
                Edit
              </button>
            ) : null}
          </div>
        </div>
      </article>

      {isEditDialogOpen && reviewId ? (
        <FeedReviewEditDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
          }}
          reviewId={reviewId}
          initialContent={reviewContent}
          containsSpoilers={reviewContainsSpoilers}
        />
      ) : null}

      {isCommentDialogOpen && reviewId ? (
        <ReviewActivityDialog
          reviewId={reviewId}
          reviewOwnerUsername={reviewOwnerUsername}
          isOpen={isCommentDialogOpen}
          onClose={() => {
            setIsCommentDialogOpen(false);
          }}
        />
      ) : null}
    </>
  );
});
