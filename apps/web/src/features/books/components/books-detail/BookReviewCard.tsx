import type { BookDetailResponse } from "@/features/books/api";
import { BOOK_MODULE_STYLES } from "@/features/books/components/books-detail/styles";

type BookReviewCardProps = {
  review: BookDetailResponse["reviews"][number];
};

export const BookReviewCard = ({ review }: BookReviewCardProps) => {
  const authorName = review.author.displayUsername ?? review.author.username;

  return (
    <div
      className="border p-4"
      style={{
        borderColor: BOOK_MODULE_STYLES.border,
        background: BOOK_MODULE_STYLES.panel,
      }}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px]" style={{ color: BOOK_MODULE_STYLES.accent }}>
          {authorName}
        </span>
        {review.ratingOutOfFive !== null ? (
          <span
            className="border px-2 py-0.5 font-mono text-[9px]"
            style={{
              borderColor: BOOK_MODULE_STYLES.borderSoft,
              color: BOOK_MODULE_STYLES.faint,
            }}
          >
            {review.ratingOutOfFive.toFixed(1)} / 5
          </span>
        ) : null}
        {review.containsSpoilers ? (
          <span
            className="border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]"
            style={{
              borderColor: BOOK_MODULE_STYLES.borderSoft,
              color: BOOK_MODULE_STYLES.faint,
            }}
          >
            spoilers
          </span>
        ) : null}
        <span
          className="ml-auto font-mono text-[9px]"
          style={{ color: BOOK_MODULE_STYLES.faint }}
        >
          {review.likeCount} {review.likeCount === 1 ? "like" : "likes"}
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: BOOK_MODULE_STYLES.muted }}>
        {review.content}
      </p>
    </div>
  );
};
