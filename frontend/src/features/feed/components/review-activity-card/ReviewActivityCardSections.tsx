import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Ellipsis,
  Film,
  Heart,
  Loader2,
  MessageSquare,
  Star,
  TriangleAlert,
  Zap,
} from "lucide-react";
import type { FeedItem } from "@/features/feed/types";
import { getPosterUrl } from "@/features/films/components/utils";
import { cn } from "@/lib/utils";
import { getRelativeTime } from "./reviewActivityCard.utils";

type ReviewMovie = NonNullable<FeedItem["movie"]>;

type ReviewActivityHeaderProps = {
  actorName: string;
  actorUsername: string;
  actorAvatar: string | null;
  actorInitial: string;
  createdAt: string;
  movieTmdbId: number | null;
  movieMediaType: ReviewMovie["mediaType"] | null;
};

export const ReviewActivityHeader = ({
  actorName,
  actorUsername,
  actorAvatar,
  actorInitial,
  createdAt,
  movieTmdbId,
  movieMediaType,
}: ReviewActivityHeaderProps) => (
  <header className="flex items-start justify-between p-5 pb-3">
    <div className="flex items-start gap-3">
      <div className="relative shrink-0">
        {actorAvatar ? (
          <img
            src={actorAvatar}
            alt={`${actorUsername} avatar`}
            className="h-10 w-10 rounded-full border border-border/70 bg-secondary object-cover"
          />
        ) : (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-secondary text-xs font-semibold text-secondary-foreground">
            {actorInitial}
          </span>
        )}

        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
      </div>

      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold leading-tight text-foreground">
          <Link
            to="/profile/$username"
            params={{ username: actorUsername }}
            className="hover:text-primary"
            viewTransition
          >
            {actorName}
          </Link>
          <Zap className="h-3 w-3 text-primary" />
        </p>
        <p className="text-xs text-muted-foreground">
          @{actorUsername} · {getRelativeTime(createdAt)}
        </p>
      </div>
    </div>

    {movieTmdbId ? (
      movieMediaType === "tv" ? (
        <Link
          to="/serials/$tmdbId"
          params={{ tmdbId: String(movieTmdbId) }}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary/65 hover:text-foreground"
          aria-label="Open series details"
          viewTransition
        >
          <Ellipsis className="h-4 w-4" />
        </Link>
      ) : (
        <Link
          to="/cinema/$tmdbId"
          params={{ tmdbId: String(movieTmdbId) }}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary/65 hover:text-foreground"
          aria-label="Open film details"
          viewTransition
        >
          <Ellipsis className="h-4 w-4" />
        </Link>
      )
    ) : null}
  </header>
);

type ReviewActivityContentProps = {
  containsSpoilers: boolean;
  isSpoilerRevealed: boolean;
  reviewContent: string;
  onRevealSpoilers: () => void;
  onOpenReview: () => void;
};

export const ReviewActivityContent = ({
  containsSpoilers,
  isSpoilerRevealed,
  reviewContent,
  onRevealSpoilers,
  onOpenReview,
}: ReviewActivityContentProps) => {
  if (containsSpoilers && !isSpoilerRevealed) {
    return (
      <div className="px-5 pb-4">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/15"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRevealSpoilers();
          }}
        >
          <TriangleAlert className="h-3.5 w-3.5" />
          Spoiler warning - click to reveal
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pb-4">
      <button
        type="button"
        className="w-full rounded-lg text-left transition-colors hover:bg-secondary/35"
        onClick={(event) => {
          event.preventDefault();
          onOpenReview();
        }}
      >
        <p className="whitespace-pre-wrap p-2 text-sm leading-relaxed text-foreground/95">
          {reviewContent || "Shared a review."}
        </p>
      </button>
    </div>
  );
};

type ReviewActivityMoviePreviewProps = {
  itemId: string;
  movie: ReviewMovie;
  ratingOutOfFive: string | null;
  filledStars: number;
};

export const ReviewActivityMoviePreview = ({
  itemId,
  movie,
  ratingOutOfFive,
  filledStars,
}: ReviewActivityMoviePreviewProps) => (
  <Link
    to={movie.mediaType === "tv" ? "/serials/$tmdbId" : "/cinema/$tmdbId"}
    params={{ tmdbId: String(movie.tmdbId) }}
    className="mx-5 mb-4 flex w-[calc(100%-2.5rem)] items-stretch overflow-hidden rounded-xl border border-border/70 bg-background/35 text-left transition-all duration-300 hover:border-primary/30"
    viewTransition
  >
    <div className="relative h-32 w-24 shrink-0 overflow-hidden">
      <img
        src={getPosterUrl(movie.posterPath)}
        alt={`${movie.title} poster`}
        className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
        loading="lazy"
      />
    </div>

    <div className="flex min-w-0 flex-1 items-center justify-between p-3.5">
      <div className="min-w-0 flex-1">
        <p className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          <Film className="h-3 w-3" /> {movie.mediaType === "tv" ? "Series" : "Film"}
        </p>
        <p className="truncate text-sm font-bold text-foreground transition-colors hover:text-primary">
          {movie.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {movie.releaseYear ?? "Year unknown"}
        </p>

        {ratingOutOfFive ? (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={`review-star-${itemId}-${index}`}
                  className={cn(
                    "h-3 w-3",
                    index < filledStars
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/60",
                  )}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">{ratingOutOfFive}</span>
          </div>
        ) : null}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors hover:text-primary" />
    </div>
  </Link>
);

type ReviewActivityFooterProps = {
  hasReviewId: boolean;
  commentCount: number;
  likeCount: number;
  viewerHasLiked: boolean;
  isLikePending: boolean;
  movieTmdbId: number | null;
  movieMediaType: ReviewMovie["mediaType"] | null;
  onOpenReview: () => void;
  onToggleLike: () => void;
};

export const ReviewActivityFooter = ({
  hasReviewId,
  commentCount,
  likeCount,
  viewerHasLiked,
  isLikePending,
  movieTmdbId,
  movieMediaType,
  onOpenReview,
  onToggleLike,
}: ReviewActivityFooterProps) => (
  <footer className="flex items-center justify-between border-t border-border/60 px-4 py-3">
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onOpenReview();
        }}
        disabled={!hasReviewId}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-all hover:bg-secondary/65 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        <span>{commentCount}</span>
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggleLike();
        }}
        disabled={!hasReviewId || isLikePending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
          viewerHasLiked
            ? "text-primary hover:bg-primary/15"
            : "text-muted-foreground hover:bg-secondary/65 hover:text-foreground",
          !hasReviewId || isLikePending ? "cursor-not-allowed opacity-50" : "",
        )}
      >
        {isLikePending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Heart className={cn("h-3.5 w-3.5", viewerHasLiked ? "fill-primary" : "")} />
        )}
        <span>{likeCount}</span>
      </button>
    </div>

    {movieTmdbId ? (
      movieMediaType === "tv" ? (
        <Link
          to="/serials/$tmdbId"
          params={{ tmdbId: String(movieTmdbId) }}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary/65 hover:text-foreground"
          aria-label="Open series details"
          viewTransition
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <Link
          to="/cinema/$tmdbId"
          params={{ tmdbId: String(movieTmdbId) }}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary/65 hover:text-foreground"
          aria-label="Open film details"
          viewTransition
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )
    ) : null}
  </footer>
);
