import type { SerialDetailResponse, SerialDetailReviewSort } from "@/features/serials/api";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";
import { formatRelativeTime } from "@/features/serials/components/serial-detail/utils";
import { MediaReviewCard } from "@/features/media-archive/components/MediaReviewCard";
import { MediaReviewsEmptyState } from "@/features/media-archive/components/MediaReviewsEmptyState";

type SerialReviewsSectionProps = {
  reviewsSort: SerialDetailReviewSort;
  onSortChange: (nextSort: SerialDetailReviewSort) => void;
  reviews: SerialDetailResponse["reviews"];
};

const formatReviewContextLabel = (
  context: SerialDetailResponse["reviews"][number]["context"],
): string | null => {
  if (!context) return null;
  if (context.episodeNumber !== null) {
    const episodeLabel = `S${context.seasonNumber}E${context.episodeNumber}`;
    return context.episodeName ? `${episodeLabel} · ${context.episodeName}` : episodeLabel;
  }
  return `Season ${context.seasonNumber}`;
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
            className="rounded-full border px-3 py-1.5 font-mono text-[10px] transition-all"
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
            className="rounded-full border px-3 py-1.5 font-mono text-[10px] transition-all"
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
        <MediaReviewsEmptyState
          message="No reviews yet for this series."
          moduleStyles={SERIAL_MODULE_STYLES}
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <MediaReviewCard
              key={review.id}
              review={review}
              moduleStyles={SERIAL_MODULE_STYLES}
              formatRelativeTime={formatRelativeTime}
              renderContextLabel={
                formatReviewContextLabel(review.context)
                  ? () => (
                      <span
                        className="inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]"
                        style={{
                          borderColor: SERIAL_MODULE_STYLES.borderSoft,
                          color: SERIAL_MODULE_STYLES.faint,
                          background: SERIAL_MODULE_STYLES.panelElevated,
                        }}
                      >
                        {formatReviewContextLabel(review.context)}
                      </span>
                    )
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </section>
  );
};
