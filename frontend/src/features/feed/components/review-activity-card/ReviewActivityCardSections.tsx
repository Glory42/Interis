import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Ellipsis,
  Film,
  Heart,
  Loader2,
  MessageSquare,
  Send,
  Star,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { FeedItem } from "@/features/feed/types";
import { getPosterUrl } from "@/features/films/components/utils";
import type { ReviewComment } from "@/features/reviews/api";
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
};

export const ReviewActivityHeader = ({
  actorName,
  actorUsername,
  actorAvatar,
  actorInitial,
  createdAt,
  movieTmdbId,
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

    <div className="flex items-center gap-1.5">
      {movieTmdbId ? (
        <Link
          to="/films/$tmdbId"
          params={{ tmdbId: String(movieTmdbId) }}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary/65 hover:text-foreground"
          aria-label="Open film details"
          viewTransition
        >
          <Ellipsis className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  </header>
);

type ReviewActivityContentProps = {
  containsSpoilers: boolean;
  reviewContent: string;
};

export const ReviewActivityContent = ({
  containsSpoilers,
  reviewContent,
}: ReviewActivityContentProps) => (
  <div className="px-5 pb-4">
    {containsSpoilers ? (
      <Badge variant="default" className="mb-2 text-[10px] uppercase tracking-wide">
        Spoilers
      </Badge>
    ) : null}

    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/95">
      {reviewContent || "Shared a review."}
    </p>
  </div>
);

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
    to="/films/$tmdbId"
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
          <Film className="h-3 w-3" /> Film
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
            <span className="font-mono text-[10px] text-muted-foreground">
              {ratingOutOfFive}
            </span>
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
  onToggleComments: () => void;
  onToggleLike: () => void;
};

export const ReviewActivityFooter = ({
  hasReviewId,
  commentCount,
  likeCount,
  viewerHasLiked,
  isLikePending,
  movieTmdbId,
  onToggleComments,
  onToggleLike,
}: ReviewActivityFooterProps) => (
  <footer className="flex items-center justify-between border-t border-border/60 px-4 py-3">
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={onToggleComments}
        disabled={!hasReviewId}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-all hover:bg-secondary/65 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        <span>{commentCount}</span>
      </button>

      <button
        type="button"
        onClick={onToggleLike}
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
      <Link
        to="/films/$tmdbId"
        params={{ tmdbId: String(movieTmdbId) }}
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary/65 hover:text-foreground"
        aria-label="Open film details"
        viewTransition
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    ) : null}
  </footer>
);

type ReviewActivityCommentsSectionProps = {
  isOpen: boolean;
  isLoading: boolean;
  isError: boolean;
  comments: ReviewComment[];
  isAuthenticated: boolean;
  commentDraft: string;
  isSubmittingComment: boolean;
  submitCommentError: string | null;
  onCommentDraftChange: (value: string) => void;
  onSubmitComment: () => void;
  onGoToLogin: () => void;
};

export const ReviewActivityCommentsSection = ({
  isOpen,
  isLoading,
  isError,
  comments,
  isAuthenticated,
  commentDraft,
  isSubmittingComment,
  submitCommentError,
  onCommentDraftChange,
  onSubmitComment,
  onGoToLogin,
}: ReviewActivityCommentsSectionProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <section className="space-y-3 border-t border-border/60 bg-background/15 px-4 py-3">
      {isLoading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading comments...
        </p>
      ) : null}

      {isError ? <p className="text-xs text-destructive">Could not load comments.</p> : null}

      {!isLoading && !isError && comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      ) : null}

      {!isLoading && !isError ? (
        <div className="space-y-2">
          {comments.map((comment) => {
            const commentAuthor = comment.authorDisplayUsername ?? comment.authorUsername;
            const commentAvatar = comment.authorAvatarUrl ?? comment.authorImage;
            const commentInitial = comment.authorUsername.slice(0, 1).toUpperCase();

            return (
              <div
                key={comment.id}
                className="rounded-lg border border-border/60 bg-card/65 p-2.5"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  {commentAvatar ? (
                    <img
                      src={commentAvatar}
                      alt={`${comment.authorUsername} avatar`}
                      className="h-6 w-6 rounded-full border border-border/60 object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-secondary text-[10px] font-semibold text-secondary-foreground">
                      {commentInitial}
                    </span>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{commentAuthor}</span>
                    <span> · {getRelativeTime(comment.createdAt)}</span>
                  </p>
                </div>
                <p className="whitespace-pre-wrap text-xs text-foreground/95">{comment.content}</p>
              </div>
            );
          })}
        </div>
      ) : null}

      {isAuthenticated ? (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <Textarea
            value={commentDraft}
            onChange={(event) => {
              onCommentDraftChange(event.target.value);
            }}
            placeholder="Write a comment..."
            className="min-h-16 rounded-lg border-border/70 bg-background/40 text-sm"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">{commentDraft.length}/2000</p>
            <Button
              type="button"
              size="sm"
              onClick={onSubmitComment}
              disabled={isSubmittingComment || commentDraft.trim().length === 0}
              className="h-8 rounded-lg"
            >
              {isSubmittingComment ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Comment
            </Button>
          </div>

          {submitCommentError ? <p className="text-xs text-destructive">{submitCommentError}</p> : null}
        </div>
      ) : (
        <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <button
            type="button"
            className="font-semibold text-primary hover:text-primary/80"
            onClick={onGoToLogin}
          >
            Sign in
          </button>{" "}
          to join the discussion.
        </p>
      )}
    </section>
  );
};
