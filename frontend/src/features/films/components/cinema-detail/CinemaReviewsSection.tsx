import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { MovieDetailResponse, MovieDetailReviewSort } from "@/features/films/api";
import { SpaceRatingDisplay } from "@/features/films/components/SpaceRating";
import { formatRatingOutOfFiveLabel } from "@/features/films/components/spaceRating.utils";
import { CINEMA_MODULE_STYLES } from "@/features/films/components/cinema-detail/styles";
import { formatRelativeTime } from "@/features/films/components/cinema-detail/utils";

type CinemaReviewsSectionProps = {
  reviewsSort: MovieDetailReviewSort;
  onSortChange: (nextSort: MovieDetailReviewSort) => void;
  reviews: MovieDetailResponse["reviews"];
};

export const CinemaReviewsSection = ({
  reviewsSort,
  onSortChange,
  reviews,
}: CinemaReviewsSectionProps) => {
  return (
    <section className="mt-10">
      <div
        className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4"
        style={{ borderColor: CINEMA_MODULE_STYLES.borderSoft }}
      >
        <h2 className="font-mono text-lg font-bold" style={{ color: CINEMA_MODULE_STYLES.text }}>
          Reviews
        </h2>

        <div className="flex gap-2">
          <button
            type="button"
            className="border px-3 py-1.5 font-mono text-[10px] transition-all"
            style={{
              borderColor:
                reviewsSort === "popular"
                  ? CINEMA_MODULE_STYLES.accent
                  : CINEMA_MODULE_STYLES.borderSoft,
              color:
                reviewsSort === "popular"
                  ? CINEMA_MODULE_STYLES.accent
                  : CINEMA_MODULE_STYLES.faint,
              background:
                reviewsSort === "popular"
                  ? "color-mix(in srgb, var(--module-cinema) 8%, transparent)"
                  : "transparent",
            }}
            onClick={() => onSortChange("popular")}
          >
            Popular
          </button>

          <button
            type="button"
            className="border px-3 py-1.5 font-mono text-[10px] transition-all"
            style={{
              borderColor:
                reviewsSort === "recent"
                  ? CINEMA_MODULE_STYLES.accent
                  : CINEMA_MODULE_STYLES.borderSoft,
              color:
                reviewsSort === "recent"
                  ? CINEMA_MODULE_STYLES.accent
                  : CINEMA_MODULE_STYLES.faint,
              background:
                reviewsSort === "recent"
                  ? "color-mix(in srgb, var(--module-cinema) 8%, transparent)"
                  : "transparent",
            }}
            onClick={() => onSortChange("recent")}
          >
            Recent
          </button>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div
          className="border p-4 font-mono text-xs"
          style={{
            borderColor: CINEMA_MODULE_STYLES.border,
            color: CINEMA_MODULE_STYLES.muted,
            background: CINEMA_MODULE_STYLES.panel,
          }}
        >
          No reviews yet for this movie.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const authorName = review.author.displayUsername ?? review.author.username;
            const avatarUrl = review.author.avatarUrl ?? review.author.image;

            return (
              <article
                key={review.id}
                className="border p-4"
                style={{
                  borderColor: CINEMA_MODULE_STYLES.border,
                  background: CINEMA_MODULE_STYLES.panel,
                }}
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
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
                        <SpaceRatingDisplay
                          ratingOutOfFive={review.ratingOutOfFive}
                          size="sm"
                        />
                        <span
                          className="font-mono text-[10px]"
                          style={{ color: CINEMA_MODULE_STYLES.faint }}
                        >
                          {formatRatingOutOfFiveLabel(review.ratingOutOfFive) ?? "Unrated"}
                        </span>
                        <span
                          className="font-mono text-[10px]"
                          style={{ color: CINEMA_MODULE_STYLES.faint }}
                        >
                          {formatRelativeTime(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className="inline-flex items-center gap-1 font-mono text-[10px]"
                    style={{
                      color: review.viewerHasLiked
                        ? CINEMA_MODULE_STYLES.accent
                        : CINEMA_MODULE_STYLES.faint,
                    }}
                  >
                    <Heart className="h-3 w-3" />
                    {review.likeCount}
                  </span>
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

                <p
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  style={{ color: CINEMA_MODULE_STYLES.muted }}
                >
                  {review.content}
                </p>

                <div
                  className="mt-3 border-t pt-3"
                  style={{ borderColor: CINEMA_MODULE_STYLES.borderSoft }}
                >
                  <Link
                    to="/reviews/$username/$reviewId"
                    params={{
                      username: review.author.username,
                      reviewId: review.id,
                    }}
                    className="font-mono text-[10px] uppercase tracking-[0.16em]"
                    style={{ color: CINEMA_MODULE_STYLES.faint }}
                    viewTransition
                  >
                    Open full review thread
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
