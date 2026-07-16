import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { getPosterUrl } from "@/features/films/components/utils";
import type { LikedReview } from "@/features/profile/api";
import { formatRelativeTime } from "@/lib/time";

export const LikedReviewCard = memo(function LikedReviewCard({
  review,
}: {
  review: LikedReview;
}) {
  const route = review.mediaType === "movie" ? "/cinema/$tmdbId" : "/serials/$tmdbId";
  const tmdbId = review.mediaTmdbId;

  return (
    <div className="border-b border-border/50 py-4 last:border-0">
      <div className="flex gap-3">
        {tmdbId ? (
          <Link to={route} params={{ tmdbId: String(tmdbId) }} className="shrink-0">
            <div className="h-16 w-11 overflow-hidden border border-border/50 bg-card/30">
              {review.mediaPosterPath ? (
                <img
                  src={getPosterUrl(review.mediaPosterPath)}
                  alt={review.mediaTitle ?? ""}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>
          </Link>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {review.mediaTitle ? (
              tmdbId ? (
                <Link
                  to={route}
                  params={{ tmdbId: String(tmdbId) }}
                  className="font-mono text-xs font-semibold text-foreground/90 hover:text-foreground"
                >
                  {review.mediaTitle}
                </Link>
              ) : (
                <span className="font-mono text-xs font-semibold text-foreground/90">
                  {review.mediaTitle}
                </span>
              )
            ) : null}
            {review.mediaReleaseYear ? (
              <span className="font-mono text-[10px] text-muted-foreground">
                {review.mediaReleaseYear}
              </span>
            ) : null}
          </div>

          <p className="mb-2 line-clamp-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {review.content}
          </p>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">
              by{" "}
              <Link
                to="/profile/$username"
                params={{ username: review.reviewerUsername }}
                className="profile-shell-accent hover:underline"
              >
                {review.reviewerDisplayUsername ?? review.reviewerUsername}
              </Link>
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">·</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              liked {formatRelativeTime(review.likedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
