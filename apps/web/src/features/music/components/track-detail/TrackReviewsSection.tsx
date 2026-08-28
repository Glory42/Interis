import type { TrackDetailResponse, TrackDetailReviewSort } from "@/features/music/track-api";
import { MUSIC_MODULE_STYLES } from "@/features/music/components/music-detail/styles";
import { MediaReviewCard } from "@/features/media-archive/components/MediaReviewCard";
import { MediaReviewsEmptyState } from "@/features/media-archive/components/MediaReviewsEmptyState";
import { formatRelativeTime } from "@/lib/time";

type TrackReviewsSectionProps = {
  reviewsSort: TrackDetailReviewSort;
  onSortChange: (nextSort: TrackDetailReviewSort) => void;
  reviews: TrackDetailResponse["reviews"];
};

export const TrackReviewsSection = ({
  reviewsSort,
  onSortChange,
  reviews,
}: TrackReviewsSectionProps) => {
  return (
    <section className="mt-10">
      <div
        className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4"
        style={{ borderColor: MUSIC_MODULE_STYLES.borderSoft }}
      >
        <h2 className="font-mono text-lg font-bold" style={{ color: MUSIC_MODULE_STYLES.text }}>
          Reviews
        </h2>

        <div className="flex gap-2">
          {(["popular", "recent"] as const).map((sort) => (
            <button
              key={sort}
              type="button"
              className="border px-3 py-1.5 font-mono text-[10px] transition-all"
              style={{
                borderColor:
                  reviewsSort === sort
                    ? MUSIC_MODULE_STYLES.accent
                    : MUSIC_MODULE_STYLES.borderSoft,
                color:
                  reviewsSort === sort ? MUSIC_MODULE_STYLES.accent : MUSIC_MODULE_STYLES.faint,
                background:
                  reviewsSort === sort
                    ? "color-mix(in srgb, var(--module-music) 8%, transparent)"
                    : "transparent",
              }}
              onClick={() => onSortChange(sort)}
            >
              {sort.charAt(0).toUpperCase() + sort.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {reviews.length === 0 ? (
        <MediaReviewsEmptyState
          message="No reviews yet for this track."
          moduleStyles={MUSIC_MODULE_STYLES}
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <MediaReviewCard
              key={review.id}
              review={review}
              moduleStyles={MUSIC_MODULE_STYLES}
              formatRelativeTime={formatRelativeTime}
            />
          ))}
        </div>
      )}
    </section>
  );
};
