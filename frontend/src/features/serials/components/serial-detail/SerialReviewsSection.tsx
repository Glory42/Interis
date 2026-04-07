import type { SerialDetailResponse, SerialDetailReviewSort } from "@/features/serials/api";
import { SerialReviewCard } from "@/features/serials/components/serial-detail/SerialReviewCard";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";

type SerialReviewsSectionProps = {
  reviewsSort: SerialDetailReviewSort;
  onSortChange: (nextSort: SerialDetailReviewSort) => void;
  reviews: SerialDetailResponse["reviews"];
};

export const SerialReviewsSection = ({
  reviewsSort,
  onSortChange,
  reviews,
}: SerialReviewsSectionProps) => {
  return (
    <section className="mt-10">
      <div
        className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4"
        style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft }}
      >
        <h2
          className="font-mono text-lg font-bold"
          style={{ color: SERIAL_MODULE_STYLES.text }}
        >
          Reviews
        </h2>

        <div className="flex gap-2">
          <button
            type="button"
            className="border px-3 py-1.5 font-mono text-[10px] transition-all"
            style={{
              borderColor:
                reviewsSort === "popular"
                  ? SERIAL_MODULE_STYLES.accent
                  : SERIAL_MODULE_STYLES.borderSoft,
              color:
                reviewsSort === "popular"
                  ? SERIAL_MODULE_STYLES.accent
                  : SERIAL_MODULE_STYLES.faint,
              background:
                reviewsSort === "popular"
                  ? "color-mix(in srgb, var(--module-serial) 8%, transparent)"
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
                  ? SERIAL_MODULE_STYLES.accent
                  : SERIAL_MODULE_STYLES.borderSoft,
              color:
                reviewsSort === "recent"
                  ? SERIAL_MODULE_STYLES.accent
                  : SERIAL_MODULE_STYLES.faint,
              background:
                reviewsSort === "recent"
                  ? "color-mix(in srgb, var(--module-serial) 8%, transparent)"
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
            borderColor: SERIAL_MODULE_STYLES.border,
            color: SERIAL_MODULE_STYLES.muted,
            background: SERIAL_MODULE_STYLES.panel,
          }}
        >
          No reviews yet for this series.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <SerialReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
};
