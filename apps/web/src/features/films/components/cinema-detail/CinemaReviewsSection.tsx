import type { MovieDetailResponse, MovieDetailReviewSort } from "@/features/films/api";
import { CINEMA_MODULE_STYLES } from "@/features/films/components/cinema-detail/styles";
import { formatRelativeTime } from "@/features/films/components/cinema-detail/utils";
import { useMovieReviewsLoadMore } from "@/features/films/hooks/useMovies";
import { MediaReviewCard } from "@/features/media-archive/components/MediaReviewCard";
import { MediaReviewsEmptyState } from "@/features/media-archive/components/MediaReviewsEmptyState";

type CinemaReviewsSectionProps = {
  tmdbId: number;
  reviewsSort: MovieDetailReviewSort;
  onSortChange: (nextSort: MovieDetailReviewSort) => void;
  reviews: MovieDetailResponse["reviews"];
  reviewsLimit: number;
  reviewsHasMore: boolean;
};

export const CinemaReviewsSection = ({
  tmdbId,
  reviewsSort,
  onSortChange,
  reviews,
  reviewsLimit,
  reviewsHasMore,
}: CinemaReviewsSectionProps) => {
  const { extraItems, loadMore, isLoading, hasMore } = useMovieReviewsLoadMore(
    tmdbId,
    reviewsSort,
    reviewsLimit,
    reviewsHasMore,
  );
  const allReviews = [...reviews, ...extraItems];

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
            className="rounded-full border px-3 py-1.5 font-mono text-[10px] transition-all"
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
            className="rounded-full border px-3 py-1.5 font-mono text-[10px] transition-all"
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

      {allReviews.length === 0 ? (
        <MediaReviewsEmptyState
          message="No reviews yet for this movie."
          moduleStyles={CINEMA_MODULE_STYLES}
        />
      ) : (
        <div className="space-y-4">
          {allReviews.map((review) => (
            <MediaReviewCard
              key={review.id}
              review={review}
              moduleStyles={CINEMA_MODULE_STYLES}
              formatRelativeTime={formatRelativeTime}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            className="rounded-full border px-4 py-1.5 font-mono text-[10px] transition-all disabled:opacity-50"
            style={{
              borderColor: CINEMA_MODULE_STYLES.borderSoft,
              color: CINEMA_MODULE_STYLES.faint,
            }}
            onClick={() => void loadMore()}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load more reviews"}
          </button>
        </div>
      )}
    </section>
  );
};
