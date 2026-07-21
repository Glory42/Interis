import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Loader2 } from "lucide-react";
import { memo, useState, type CSSProperties, type MouseEvent } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { MovieDetailResponse } from "@/features/films/api";
import { SpaceRatingDisplay } from "@/features/films/components/SpaceRating";
import { CINEMA_MODULE_STYLES } from "@/features/films/components/cinema-detail/styles";
import { formatRelativeTime } from "@/features/films/components/cinema-detail/utils";
import { formatRatingLabel } from "@/lib/rating";
import { useLikeReview, useUnlikeReview } from "@/features/reviews/hooks/useReviews";

type CinemaReviewCardProps = {
  review: MovieDetailResponse["reviews"][number];
};

// Memoized because it's rendered in a .map() alongside sort-toggle state in
// the parent section — this skips re-rendering every card when only the
// sort button's local state changes.
export const CinemaReviewCard = memo(function CinemaReviewCard({
  review,
}: CinemaReviewCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const authorName = review.author.displayUsername ?? review.author.username;
  const avatarUrl = review.author.avatarUrl;

  const likeReviewMutation = useLikeReview(review.id);
  const unlikeReviewMutation = useUnlikeReview(review.id);
  const isLikePending = likeReviewMutation.isPending || unlikeReviewMutation.isPending;

  // Local optimistic override — the movie-detail query this card's data
  // comes from isn't patched by the review-like mutations (those only patch
  // the feed and review-detail caches), so reflect the toggle here directly.
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
      className="cursor-pointer border bg-[var(--row-bg)] p-4 transition-colors hover:bg-[var(--row-hover-bg)]"
      style={
        {
          borderColor: CINEMA_MODULE_STYLES.border,
          "--row-bg": CINEMA_MODULE_STYLES.panel,
          "--row-hover-bg": CINEMA_MODULE_STYLES.panelElevated,
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
                className="h-9 w-9 border object-cover"
                style={{ borderColor: CINEMA_MODULE_STYLES.border }}
              />
            ) : (
              <span
                className="inline-flex h-9 w-9 items-center justify-center border font-mono text-xs"
                style={{
                  borderColor: CINEMA_MODULE_STYLES.border,
                  color: CINEMA_MODULE_STYLES.text,
                  background: CINEMA_MODULE_STYLES.panelElevated,
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
              style={{ color: CINEMA_MODULE_STYLES.text }}
              viewTransition
            >
              {authorName}
            </Link>

            <div className="mt-0.5 flex items-center gap-2">
              <SpaceRatingDisplay rating={review.rating} size="sm" />
              <span className="font-mono text-[10px]" style={{ color: CINEMA_MODULE_STYLES.faint }}>
                {formatRatingLabel(review.rating) ?? "Unrated"}
              </span>
              <span className="font-mono text-[10px]" style={{ color: CINEMA_MODULE_STYLES.faint }}>
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
              "--like-color": viewerHasLiked ? CINEMA_MODULE_STYLES.accent : CINEMA_MODULE_STYLES.faint,
              "--like-hover-color": viewerHasLiked ? CINEMA_MODULE_STYLES.faint : CINEMA_MODULE_STYLES.text,
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
          className="mb-2 inline-flex border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em]"
          style={{
            borderColor: CINEMA_MODULE_STYLES.accent,
            color: CINEMA_MODULE_STYLES.accent,
            background: CINEMA_MODULE_STYLES.badge,
          }}
        >
          Spoilers
        </p>
      ) : null}

      <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: CINEMA_MODULE_STYLES.muted }}>
        {review.content}
      </p>
    </article>
  );
});
