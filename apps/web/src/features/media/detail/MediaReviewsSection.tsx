import type { ReactNode } from "react";
import { formatRelativeTime } from "@/lib/time";
import type { MediaModuleStyles } from "@/features/media/styles";
import { MediaReviewCard, type MediaReview } from "@/features/media/detail/MediaReviewCard";
import { MediaReviewsEmptyState } from "@/features/media/detail/MediaReviewsEmptyState";

type ReviewSort = "popular" | "recent";

type MediaReviewsSectionProps = {
  moduleStyles: MediaModuleStyles;
  emptyMessage: string;
  reviewsSort: ReviewSort;
  onSortChange: (nextSort: ReviewSort) => void;
  reviews: MediaReview[];
  extraItems: MediaReview[];
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  renderContextLabel?: (review: MediaReview) => ReactNode;
};

export const MediaReviewsSection = ({
  moduleStyles,
  emptyMessage,
  reviewsSort,
  onSortChange,
  reviews,
  extraItems,
  isLoadingMore,
  hasMore,
  onLoadMore,
  renderContextLabel,
}: MediaReviewsSectionProps) => {
  const allReviews = [...reviews, ...extraItems];

  return (
    <section className="mt-10">
      <div
        className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4"
        style={{ borderColor: moduleStyles.borderSoft }}
      >
        <h2 className="font-mono text-lg font-bold" style={{ color: moduleStyles.text }}>
          Reviews
        </h2>

        <div className="flex gap-2">
          {(["popular", "recent"] as const).map((sort) => (
            <button
              key={sort}
              type="button"
              className="rounded-full border px-3 py-1.5 font-mono text-[10px] capitalize transition-all"
              style={{
                borderColor: reviewsSort === sort ? moduleStyles.accent : moduleStyles.borderSoft,
                color: reviewsSort === sort ? moduleStyles.accent : moduleStyles.faint,
                background:
                  reviewsSort === sort
                    ? `color-mix(in srgb, ${moduleStyles.accent} 8%, transparent)`
                    : "transparent",
              }}
              onClick={() => onSortChange(sort)}
            >
              {sort}
            </button>
          ))}
        </div>
      </div>

      {allReviews.length === 0 ? (
        <MediaReviewsEmptyState message={emptyMessage} moduleStyles={moduleStyles} />
      ) : (
        <div className="space-y-4">
          {allReviews.map((review) => (
            <MediaReviewCard
              key={review.id}
              review={review}
              moduleStyles={moduleStyles}
              formatRelativeTime={formatRelativeTime}
              renderContextLabel={
                renderContextLabel ? () => renderContextLabel(review) : undefined
              }
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
              borderColor: moduleStyles.borderSoft,
              color: moduleStyles.faint,
            }}
            onClick={() => onLoadMore()}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading..." : "Load more reviews"}
          </button>
        </div>
      )}
    </section>
  );
};
