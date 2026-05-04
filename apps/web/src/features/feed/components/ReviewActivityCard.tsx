import { useState, type CSSProperties, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  CornerDownRight,
  Heart,
  Loader2,
  MessageSquare,
  PenSquare,
  TriangleAlert,
} from "lucide-react";
import { SpaceRatingDisplay } from "@/features/films/components/SpaceRating";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import { FeedReviewEditDialog } from "@/features/feed/components/FeedReviewEditDialog";
import {
  feedChannelMeta,
  getRelativeTime,
} from "@/features/feed/components/feed-row.utils";
import type { FeedItem } from "@/features/feed/types";
import { cn } from "@/lib/utils";
import { useReviewActivityCard } from "./review-activity-card/useReviewActivityCard";

type ReviewActivityCardProps = {
  item: FeedItem;
};

const getReviewActionLabel = (item: FeedItem): string => {
  switch (item.kind) {
    case "review":
      return "published a review";
    case "diary_entry":
      return "logged with a review";
    case "liked_review":
      return item.metadata.targetUsername
        ? `liked @${item.metadata.targetUsername}'s review`
        : "liked a review";
    case "commented":
      return item.metadata.targetUsername
        ? `commented on @${item.metadata.targetUsername}'s review`
        : "commented on a review";
    default:
      return "updated a review";
  }
};

const getReviewBodyFallback = (item: FeedItem): string => {
  if (item.kind === "commented") {
    return "Left a comment on a review.";
  }

  if (item.kind === "liked_review") {
    return "Liked a review.";
  }

  return "Shared a review.";
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
    ratingOutOfFive,
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

  const channel = movie?.mediaType === "tv" ? "serial" : "cinema";
  const channelMeta = feedChannelMeta[channel];
  const ratingValue =
    ratingOutOfFive === null ? null : Number.parseFloat(ratingOutOfFive);
  const reviewId = item.review?.id ?? item.metadata.reviewId ?? null;
  const isOwnReview = Boolean(user && reviewId && user.id === item.actor.id);
  const actionLabel = getReviewActionLabel(item);
  const showRating = item.kind === "review" || item.kind === "diary_entry";

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const channelStyle = {
    borderColor: `color-mix(in srgb, ${channelMeta.color} 36%, transparent)`,
    background: channelMeta.tint,
    color: channelMeta.color,
  } satisfies CSSProperties;

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
        className="group cursor-pointer border-b border-border/60 py-6"
        onClick={handleRowClick}
      >
        <div className="flex items-center gap-3">
          <FeedActorAvatar
            avatarUrl={actorAvatar}
            username={item.actor.username}
            initial={actorInitial}
            style={channelStyle}
          />
          <div className="flex min-w-0 flex-1 items-baseline gap-2">
            <Link
              to="/profile/$username"
              params={{ username: item.actor.username }}
              className="truncate font-mono text-xs font-bold text-foreground hover:text-primary"
              viewTransition
            >
              {actorName}
            </Link>
            <span className="truncate font-mono text-[10px] text-muted-foreground/80">
              @{item.actor.username}
            </span>
            <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
              {getRelativeTime(createdAt)}
            </span>
          </div>
        </div>

        <p className="mt-2 ml-10 font-mono text-[10px] text-muted-foreground/85">
          {actionLabel}
        </p>

        <div className="mt-3 ml-10 flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 items-center gap-2 border px-2.5 py-1" style={channelStyle}>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em]">
              {channelMeta.label}
            </span>
            <CornerDownRight className="h-3 w-3" />
            {movie ? (
              <Link
                to={movie.mediaType === "tv" ? "/serials/$tmdbId" : "/cinema/$tmdbId"}
                params={{ tmdbId: String(movie.tmdbId) }}
                className="line-clamp-1 font-mono text-xs font-bold text-foreground hover:text-primary"
                viewTransition
              >
                {movie.title}
              </Link>
            ) : (
              <span className="font-mono text-xs font-bold text-foreground">Review entry</span>
            )}
            {movie?.releaseYear ? (
              <span className="font-mono text-[10px] text-muted-foreground">{movie.releaseYear}</span>
            ) : null}
          </div>

          {showRating ? (
            <SpaceRatingDisplay ratingOutOfFive={ratingValue} size="sm" />
          ) : null}
        </div>

        {reviewContainsSpoilers && !isSpoilerRevealed ? (
          <div className="mt-3 ml-10">
            <button
              type="button"
              className="inline-flex items-center gap-2 border border-amber-500/40 bg-amber-500/12 px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200 transition-colors hover:bg-amber-500/18"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                revealSpoilers();
              }}
            >
              <TriangleAlert className="h-3.5 w-3.5" />
              spoiler warning - reveal
            </button>
          </div>
        ) : (
          <p className="mt-3 ml-10 w-full pr-3 font-mono text-sm leading-relaxed text-foreground/80 transition-colors group-hover:text-foreground">
            {reviewContent || getReviewBodyFallback(item)}
          </p>
        )}

        <div className="mt-3 ml-10 flex items-center gap-5">
          <button
            type="button"
            onClick={() => {
              void openReviewFromAction();
            }}
            disabled={!hasReviewId}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {commentCount}
          </button>
          <button
            type="button"
            onClick={() => {
              void toggleLike();
            }}
            disabled={!hasReviewId || isLikePending}
            className={cn(
              "inline-flex items-center gap-1.5 font-mono text-[11px] transition-colors",
              viewerHasLiked ? "text-primary" : "text-muted-foreground hover:text-foreground",
              !hasReviewId || isLikePending ? "cursor-not-allowed opacity-50" : "",
            )}
          >
            {isLikePending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Heart className={cn("h-3.5 w-3.5", viewerHasLiked ? "fill-current" : "")} />
            )}
            {likeCount}
          </button>

          {isOwnReview && reviewId ? (
            <button
              type="button"
              onClick={() => {
                setIsEditDialogOpen(true);
              }}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <PenSquare className="h-3.5 w-3.5" />
              EDIT
            </button>
          ) : null}
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
    </>
  );
};
