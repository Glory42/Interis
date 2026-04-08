import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star, TriangleAlert } from "lucide-react";
import { getPosterUrl } from "@/features/films/components/utils";
import type { UserReview } from "@/features/profile/api";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { useUserReviews } from "@/features/profile/hooks/useProfile";

type ProfileReviewsPageProps = {
  username: string;
};

type RatingToken = "full" | "half" | "empty";

const mediaMetaByType: Record<
  UserReview["mediaType"],
  {
    label: string;
    color: string;
  }
> = {
  movie: {
    label: "Cinema",
    color: "var(--module-cinema)",
  },
  tv: {
    label: "Serial",
    color: "var(--module-serial)",
  },
};

const formatDate = (value: string | null): string => {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US");
};

const toRatingTokens = (ratingOutOfFive: number | null | undefined): RatingToken[] => {
  if (
    ratingOutOfFive === null ||
    ratingOutOfFive === undefined ||
    Number.isNaN(ratingOutOfFive)
  ) {
    return ["empty", "empty", "empty", "empty", "empty"];
  }

  const normalized = Math.max(0, Math.min(5, ratingOutOfFive));

  return Array.from({ length: 5 }, (_, index) => {
    const delta = normalized - index;
    if (delta >= 1) {
      return "full";
    }

    if (delta >= 0.5) {
      return "half";
    }

    return "empty";
  });
};

const ReviewStars = ({
  ratingOutOfFive,
}: {
  ratingOutOfFive: number | null | undefined;
}) => {
  const tokens = toRatingTokens(ratingOutOfFive);
  const label =
    ratingOutOfFive === null || ratingOutOfFive === undefined
      ? "Unrated"
      : Number.isInteger(ratingOutOfFive)
        ? `${ratingOutOfFive.toFixed(0)} stars`
        : `${ratingOutOfFive.toFixed(1)} stars`;

  return (
    <span className="flex items-center gap-0.5" aria-label={label}>
      {tokens.map((token, index) => {
        if (token === "full") {
          return (
            <span
              key={`review-rating-full-${index}`}
              style={{ color: "var(--module-cinema)", fontSize: 11 }}
            >
              ★
            </span>
          );
        }

        if (token === "half") {
          return (
            <span
              key={`review-rating-half-${index}`}
              style={{ color: "var(--module-cinema)", fontSize: 11 }}
            >
              ½
            </span>
          );
        }

        return (
          <span
            key={`review-rating-empty-${index}`}
            style={{ color: "var(--profile-shell-muted)", fontSize: 11 }}
          >
            ★
          </span>
        );
      })}
    </span>
  );
};

export const ProfileReviewsPage = ({ username }: ProfileReviewsPageProps) => {
  const reviewsQuery = useUserReviews(username);
  const reviews = reviewsQuery.data ?? [];
  const [revealedSpoilersById, setRevealedSpoilersById] = useState<
    Record<string, boolean>
  >({});

  return (
    <>
      {reviewsQuery.isPending ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
          Loading reviews...
        </div>
      ) : null}

      {reviewsQuery.isError ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          Could not load reviews.
        </div>
      ) : null}

      {!reviewsQuery.isPending && !reviewsQuery.isError && reviews.length === 0 ? (
        <ProfileTabEmptyState
          icon={Star}
          title="No written reviews yet"
          description="This profile has not published any reviews yet."
        />
      ) : null}

      <div className="space-y-3">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest profile-shell-accent">
            <span>Reviews </span>
            <span className="profile-shell-muted">({reviews.length})</span>
          </p>
        </div>

        {reviews.map((entry) => (
          <article
            key={entry.id}
            className="group border transition-colors hover:border-primary/30"
            style={{
              borderColor: "var(--profile-shell-border)",
              background: "var(--profile-shell-panel)",
            }}
          >
            <div className="grid gap-3 p-3 sm:p-4" style={{ gridTemplateColumns: "68px 1fr" }}>
              {entry.mediaType === "tv" ? (
                <Link
                  to="/serials/$tmdbId"
                  params={{ tmdbId: String(entry.tmdbId) }}
                  className="shrink-0"
                  viewTransition
                >
                  <div
                    className="overflow-hidden border"
                    style={{
                      width: 68,
                      height: 102,
                      borderColor: "var(--profile-shell-row-border)",
                      background: "color-mix(in srgb, var(--profile-shell-bg) 85%, black)",
                    }}
                  >
                    <img
                      src={getPosterUrl(entry.posterPath)}
                      alt={`${entry.title} poster`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </Link>
              ) : (
                <Link
                  to="/cinema/$tmdbId"
                  params={{ tmdbId: String(entry.tmdbId) }}
                  className="shrink-0"
                  viewTransition
                >
                  <div
                    className="overflow-hidden border"
                    style={{
                      width: 68,
                      height: 102,
                      borderColor: "var(--profile-shell-row-border)",
                      background: "color-mix(in srgb, var(--profile-shell-bg) 85%, black)",
                    }}
                  >
                    <img
                      src={getPosterUrl(entry.posterPath)}
                      alt={`${entry.title} poster`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </Link>
              )}

              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
                  <Link
                    to="/reviews/$username/$reviewId"
                    params={{ username, reviewId: entry.id }}
                    className="font-sans text-sm font-semibold leading-snug hover:underline"
                    style={{ color: "var(--profile-shell-fg)" }}
                    viewTransition
                  >
                    {entry.title}
                    {entry.releaseYear ? (
                      <span className="profile-shell-muted"> ({entry.releaseYear})</span>
                    ) : null}
                  </Link>

                  <span
                    className="mt-0.5 shrink-0 border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest"
                    style={{
                      borderColor: `color-mix(in srgb, ${mediaMetaByType[entry.mediaType].color} 25%, transparent)`,
                      color: mediaMetaByType[entry.mediaType].color,
                    }}
                  >
                    {mediaMetaByType[entry.mediaType].label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <ReviewStars ratingOutOfFive={entry.ratingOutOfFive} />
                  <span className="font-mono text-[9px] profile-shell-muted">
                    Reviewed on {formatDate(entry.createdAt)}
                  </span>
                </div>

                {entry.containsSpoilers && !revealedSpoilersById[entry.id] ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 border border-amber-500/40 bg-amber-500/12 px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200 transition-colors hover:bg-amber-500/18"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setRevealedSpoilersById((current) => ({
                        ...current,
                        [entry.id]: true,
                      }));
                    }}
                  >
                    <TriangleAlert className="h-3.5 w-3.5" />
                    spoiler warning - reveal
                  </button>
                ) : (
                  <Link
                    to="/reviews/$username/$reviewId"
                    params={{ username, reviewId: entry.id }}
                    className="block whitespace-pre-wrap font-mono text-xs leading-relaxed transition-colors"
                    style={{ color: "color-mix(in srgb, var(--profile-shell-fg) 58%, transparent)" }}
                    viewTransition
                  >
                    {entry.content}
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
};
