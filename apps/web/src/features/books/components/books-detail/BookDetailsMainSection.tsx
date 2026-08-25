import type { BookDetailResponse } from "@/features/books/api";
import { BOOK_MODULE_STYLES } from "@/features/books/components/books-detail/styles";

type BookDetailsMainSectionProps = {
  detail: BookDetailResponse;
};

function toLanguageLabel(code: string | null): string {
  if (!code) return "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export const BookDetailsMainSection = ({ detail }: BookDetailsMainSectionProps) => {
  const book = detail.book;

  const communityRatingLabel =
    detail.userLog?.rating !== null && detail.userLog?.rating !== undefined
      ? detail.userLog.rating.toFixed(1)
      : "--";

  const authorsLine = book.authors.join(", ");

  return (
    <section>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {book.publishedYear ? (
          <span className="font-mono text-[10px]" style={{ color: BOOK_MODULE_STYLES.faint }}>
            {book.publishedYear}
          </span>
        ) : null}
        {book.categories.slice(0, 3).map((cat) => (
          <span
            key={`book-cat-${cat}`}
            className="border px-2 py-0.5 font-mono text-[9px]"
            style={{
              borderColor: BOOK_MODULE_STYLES.border,
              color: BOOK_MODULE_STYLES.muted,
            }}
          >
            {cat}
          </span>
        ))}
      </div>

      <h1
        className="mb-1 font-mono text-3xl font-bold leading-tight md:text-5xl"
        style={{ color: BOOK_MODULE_STYLES.text }}
      >
        {book.title}
      </h1>

      {book.subtitle ? (
        <p className="mb-1 font-mono text-base" style={{ color: BOOK_MODULE_STYLES.faint }}>
          {book.subtitle}
        </p>
      ) : null}

      <p className="mb-6 font-mono text-sm" style={{ color: BOOK_MODULE_STYLES.muted }}>
        <span>by </span>
        <span style={{ color: BOOK_MODULE_STYLES.accent }}>{authorsLine || "Unknown author"}</span>
      </p>

      <div
        className="mb-8 flex flex-wrap items-center gap-8 border-b pb-8"
        style={{ borderColor: BOOK_MODULE_STYLES.borderSoft }}
      >
        <div>
          <p
            className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: BOOK_MODULE_STYLES.faint }}
          >
            Community
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono text-2xl font-bold"
              style={{ color: BOOK_MODULE_STYLES.accent }}
            >
              {communityRatingLabel}
            </span>
            <span
              className="font-mono text-[10px]"
              style={{ color: BOOK_MODULE_STYLES.faint }}
            >
              {detail.logsCount.toLocaleString()} reads
            </span>
          </div>
        </div>

        <div>
          <p
            className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: BOOK_MODULE_STYLES.faint }}
          >
            Reviews
          </p>
          <span
            className="font-mono text-2xl font-bold"
            style={{ color: BOOK_MODULE_STYLES.muted }}
          >
            {detail.reviewCount}
          </span>
        </div>
      </div>

      {book.description ? (
        <p className="mb-8 text-sm leading-relaxed">
          {book.description}
        </p>
      ) : (
        <p className="mb-8 text-sm leading-relaxed" style={{ color: BOOK_MODULE_STYLES.muted }}>
          No description available.
        </p>
      )}

      <div
        className="mb-8 grid grid-cols-2 gap-4 border-y py-5 sm:grid-cols-3"
        style={{ borderColor: BOOK_MODULE_STYLES.borderSoft }}
      >
        {book.publisher ? (
          <div>
            <p
              className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
              style={{ color: BOOK_MODULE_STYLES.faint }}
            >
              Publisher
            </p>
            <p className="font-mono text-[11px]" style={{ color: BOOK_MODULE_STYLES.muted }}>
              {book.publisher}
            </p>
          </div>
        ) : null}

        {book.pageCount ? (
          <div>
            <p
              className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
              style={{ color: BOOK_MODULE_STYLES.faint }}
            >
              Pages
            </p>
            <p className="font-mono text-[11px]" style={{ color: BOOK_MODULE_STYLES.muted }}>
              {book.pageCount.toLocaleString()}
            </p>
          </div>
        ) : null}

        {book.language ? (
          <div>
            <p
              className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
              style={{ color: BOOK_MODULE_STYLES.faint }}
            >
              Language
            </p>
            <p className="font-mono text-[11px]" style={{ color: BOOK_MODULE_STYLES.muted }}>
              {toLanguageLabel(book.language)}
            </p>
          </div>
        ) : null}

        {book.isbn13 ? (
          <div>
            <p
              className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
              style={{ color: BOOK_MODULE_STYLES.faint }}
            >
              ISBN-13
            </p>
            <p className="font-mono text-[11px]" style={{ color: BOOK_MODULE_STYLES.muted }}>
              {book.isbn13}
            </p>
          </div>
        ) : null}

        {book.publishedDate ? (
          <div>
            <p
              className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
              style={{ color: BOOK_MODULE_STYLES.faint }}
            >
              Published
            </p>
            <p className="font-mono text-[11px]" style={{ color: BOOK_MODULE_STYLES.muted }}>
              {book.publishedDate}
            </p>
          </div>
        ) : null}

        {book.googleBooksUrl ? (
          <div>
            <p
              className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
              style={{ color: BOOK_MODULE_STYLES.faint }}
            >
              Google Books
            </p>
            <a
              href={book.googleBooksUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] underline"
              style={{ color: BOOK_MODULE_STYLES.accent }}
            >
              View →
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
};
