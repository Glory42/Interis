import type { MovieDetailResponse, MovieDetailReviewSort } from "@/features/films/api";
import { CinemaReviewCard } from "@/features/films/components/cinema-detail/CinemaReviewCard";
import { CINEMA_MODULE_STYLES } from "@/features/films/components/cinema-detail/styles";

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
          {reviews.map((review) => (
            <CinemaReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
};
