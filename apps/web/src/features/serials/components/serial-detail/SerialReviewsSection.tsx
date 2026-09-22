import type { SerialDetailResponse, SerialDetailReviewSort } from "@/features/serials/api";
import { SERIAL_MODULE_STYLES } from "@/features/media/styles";
import { useSeriesReviewsLoadMore } from "@/features/serials/hooks/useSerials";
import { MediaReviewsSection } from "@/features/media/detail/MediaReviewsSection";

type SerialReviewsSectionProps = {
  tmdbId: number;
  reviewsSort: SerialDetailReviewSort;
  onSortChange: (nextSort: SerialDetailReviewSort) => void;
  reviews: SerialDetailResponse["reviews"];
  reviewsLimit: number;
  reviewsHasMore: boolean;
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
  tmdbId,
  reviewsSort,
  onSortChange,
  reviews,
  reviewsLimit,
  reviewsHasMore,
}: SerialReviewsSectionProps) => {
  const { extraItems, loadMore, isLoading, hasMore } = useSeriesReviewsLoadMore(
    tmdbId,
    reviewsSort,
    reviewsLimit,
    reviewsHasMore,
  );

  const contextByReviewId = new Map(
    [...reviews, ...extraItems].map((review) => [review.id, formatReviewContextLabel(review.context)]),
  );

  return (
    <MediaReviewsSection
      moduleStyles={SERIAL_MODULE_STYLES}
      emptyMessage="No reviews yet for this series."
      reviewsSort={reviewsSort}
      onSortChange={onSortChange}
      reviews={reviews}
      extraItems={extraItems}
      isLoadingMore={isLoading}
      hasMore={hasMore}
      onLoadMore={() => void loadMore()}
      renderContextLabel={(review) => {
        const label = contextByReviewId.get(review.id);
        if (!label) {
          return undefined;
        }

        return (
          <span
            className="inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]"
            style={{
              borderColor: SERIAL_MODULE_STYLES.borderSoft,
              color: SERIAL_MODULE_STYLES.faint,
              background: SERIAL_MODULE_STYLES.panelElevated,
            }}
          >
            {label}
          </span>
        );
      }}
    />
  );
};
