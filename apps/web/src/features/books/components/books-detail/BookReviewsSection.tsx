import type { BookDetailResponse, BookDetailReviewSort } from "@/features/books/api";
import { BookReviewCard } from "@/features/books/components/books-detail/BookReviewCard";
import { BOOK_MODULE_STYLES } from "@/features/books/components/books-detail/styles";

type BookReviewsSectionProps = {
  reviewsSort: BookDetailReviewSort;
  onSortChange: (nextSort: BookDetailReviewSort) => void;
  reviews: BookDetailResponse["reviews"];
};

export const BookReviewsSection = ({
  reviewsSort,
  onSortChange,
  reviews,
}: BookReviewsSectionProps) => {
  return (
    <section className="mt-10">
      <div
        className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4"
        style={{ borderColor: BOOK_MODULE_STYLES.borderSoft }}
      >
        <h2
          className="font-mono text-lg font-bold"
          style={{ color: BOOK_MODULE_STYLES.text }}
        >
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
                    ? BOOK_MODULE_STYLES.accent
                    : BOOK_MODULE_STYLES.borderSoft,
                color:
                  reviewsSort === sort ? BOOK_MODULE_STYLES.accent : BOOK_MODULE_STYLES.faint,
                background:
                  reviewsSort === sort
                    ? "color-mix(in srgb, var(--module-book) 8%, transparent)"
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
        <div
          className="border p-4 font-mono text-xs"
          style={{
            borderColor: BOOK_MODULE_STYLES.border,
            color: BOOK_MODULE_STYLES.muted,
            background: BOOK_MODULE_STYLES.panel,
          }}
        >
          No reviews yet for this book.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <BookReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
};
