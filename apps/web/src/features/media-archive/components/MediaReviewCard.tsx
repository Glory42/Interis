import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Loader2 } from "lucide-react";
import { memo, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SpaceRatingDisplay } from "@/features/films/components/SpaceRating";
import { formatRatingLabel } from "@/lib/rating";
import { useLikeReview, useUnlikeReview } from "@/features/reviews/hooks/useReviews";
import type { ReviewCardModuleStyles } from "@/features/media-archive/types";

type MediaReviewCardReview = {
  id: string;
  content: string;
  containsSpoilers: boolean;
  createdAt: string;
  rating: number | null;
  likeCount: number;
  viewerHasLiked: boolean;
  author: {
    username: string;
    displayUsername: string | null;
    avatarUrl: string | null;
  };
};

type MediaReviewCardProps = {
  review: MediaReviewCardReview;
  moduleStyles: ReviewCardModuleStyles;
  formatRelativeTime: (value: string) => string;
  renderContextLabel?: () => ReactNode;
};

// Memoized because it's rendered in a .map() alongside sort-toggle / accordion
// state in the parent section - this skips re-rendering every card when only
// that unrelated local state changes.
export const MediaReviewCard = memo(function MediaReviewCard({
  review,
  moduleStyles,
  formatRelativeTime,
  renderContextLabel,
}: MediaReviewCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const authorName = review.author.displayUsername ?? review.author.username;
  const avatarUrl = review.author.avatarUrl;

  const likeReviewMutation = useLikeReview(review.id);
  const unlikeReviewMutation = useUnlikeReview(review.id);
  const isLikePending = likeReviewMutation.isPending || unlikeReviewMutation.isPending;

  // Local optimistic override — the detail query this card's data comes from
  // isn't patched by the review-like mutations (those only patch the feed and
  // review-detail caches), so reflect the toggle here directly.
  const [optimisticLike, setOptimisticLike] = useState<{
    liked: boolean;
    count: number;
  } | null>(null);

  const viewerHasLiked = optimisticLike?.liked ?? review.viewerHasLiked;
  const likeCount = optimisticLike?.count ?? review.likeCount;

  const handleRowClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, button, textarea, input")) {
      return;
    }

    void navigate({
      to: "/reviews/$username/$reviewId",
      params: { username: review.author.username, reviewId: review.id },
      viewTransition: true,
    });
  };

  const handleToggleLike = async () => {
    if (isLikePending) {
      return;
    }

    if (!user) {
      const redirectPath = `${window.location.pathname}${window.location.search}`;
      await navigate({ to: "/login", search: { redirect: redirectPath } });
      return;
    }

    if (viewerHasLiked) {
      setOptimisticLike({ liked: false, count: Math.max(likeCount - 1, 0) });
      await unlikeReviewMutation.mutateAsync();
    } else {
      setOptimisticLike({ liked: true, count: likeCount + 1 });
      await likeReviewMutation.mutateAsync();
    }
  };

  return (
    <article
      className="cursor-pointer rounded-xl border bg-[var(--row-bg)] p-4 transition-colors hover:bg-[var(--row-hover-bg)]"
      style={
        {
          borderColor: moduleStyles.border,
          "--row-bg": moduleStyles.panel,
          "--row-hover-bg": moduleStyles.panelElevated,
        } as CSSProperties
      }
      onClick={handleRowClick}
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/profile/$username" params={{ username: review.author.username }} viewTransition>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${review.author.username} avatar`}
                className="h-9 w-9 rounded-full border object-cover"
                style={{ borderColor: moduleStyles.border }}
              />
            ) : (
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border font-mono text-xs"
                style={{
                  borderColor: moduleStyles.border,
                  color: moduleStyles.text,
                  background: moduleStyles.panelElevated,
                }}
              >
                {review.author.username.slice(0, 1).toUpperCase()}
              </span>
            )}
          </Link>

          <div>
            <Link
              to="/profile/$username"
              params={{ username: review.author.username }}
              className="font-mono text-xs font-bold"
              style={{ color: moduleStyles.text }}
              viewTransition
            >
              {authorName}
            </Link>

            {renderContextLabel ? <div className="mt-0.5">{renderContextLabel()}</div> : null}

            <div className="mt-0.5 flex items-center gap-2">
              <SpaceRatingDisplay rating={review.rating} size="sm" />
              <span className="font-mono text-[10px]" style={{ color: moduleStyles.faint }}>
                {formatRatingLabel(review.rating) ?? "Unrated"}
              </span>
              <span className="font-mono text-[10px]" style={{ color: moduleStyles.faint }}>
                {formatRelativeTime(review.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void handleToggleLike();
          }}
          disabled={isLikePending}
          className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--like-color)] transition-colors hover:text-[var(--like-hover-color)] disabled:cursor-not-allowed disabled:opacity-60"
          style={
            {
              "--like-color": viewerHasLiked ? moduleStyles.accent : moduleStyles.faint,
              "--like-hover-color": viewerHasLiked ? moduleStyles.faint : moduleStyles.text,
            } as CSSProperties
          }
        >
          {isLikePending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Heart className={viewerHasLiked ? "h-3 w-3 fill-current" : "h-3 w-3"} />
          )}
          {likeCount}
        </button>
      </div>

      {review.containsSpoilers ? (
        <p
          className="mb-2 inline-flex rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em]"
          style={{
            borderColor: moduleStyles.accent,
            color: moduleStyles.accent,
            background: moduleStyles.badge,
          }}
        >
          Spoilers
        </p>
      ) : null}

      <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: moduleStyles.muted }}>
        {review.content}
      </p>
    </article>
  );
});
