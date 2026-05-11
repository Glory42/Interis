import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import type { BooksArchiveItem } from "@/features/books/api";
import { BOOK_MODULE_STYLES } from "@/features/books/components/books-archive/constants";

type GridBookCardProps = {
  book: BooksArchiveItem;
};

export const GridBookCard = ({ book }: GridBookCardProps) => {
  const stateLabel = book.viewerHasLogged ? "Read" : book.viewerWantToRead ? "Queue" : null;
  const authorsLine = book.authors.slice(0, 2).join(", ");

  return (
    <Link
      to="/books/$volumeId"
      params={{ volumeId: book.googleVolumeId }}
      className="block w-full text-left"
      viewTransition
    >
      <div
        className="relative mb-3 aspect-2/3 overflow-hidden border transition-colors"
        style={{
          borderColor: BOOK_MODULE_STYLES.border,
          background: BOOK_MODULE_STYLES.panel,
        }}
      >
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={`${book.title} cover`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2"
            style={{ background: BOOK_MODULE_STYLES.panelSoft }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center"
              style={{ background: BOOK_MODULE_STYLES.panelStrong }}
            >
              <BookOpen className="h-4 w-4" style={{ color: BOOK_MODULE_STYLES.accent }} />
            </div>
            <span
              className="font-mono text-[8px] uppercase tracking-[0.22em]"
              style={{ color: BOOK_MODULE_STYLES.faint }}
            >
              No Cover
            </span>
          </div>
        )}

        {stateLabel ? (
          <div className="absolute right-2 top-2">
            <span
              className="border px-2 py-0.5 font-mono text-[9px] tracking-[0.16em]"
              style={{
                borderColor: BOOK_MODULE_STYLES.accent,
                color: BOOK_MODULE_STYLES.accent,
                background: BOOK_MODULE_STYLES.badge,
              }}
            >
              {stateLabel}
            </span>
          </div>
        ) : null}

        {book.avgRatingOutOfFive !== null ? (
          <div className="absolute bottom-2 right-2">
            <span
              className="border px-2 py-0.5 font-mono text-[9px]"
              style={{
                borderColor: BOOK_MODULE_STYLES.accent,
                color: BOOK_MODULE_STYLES.accent,
                background: BOOK_MODULE_STYLES.badge,
              }}
            >
              {book.avgRatingOutOfFive.toFixed(1)}
            </span>
          </div>
        ) : null}
      </div>

      <p
        className="truncate font-mono text-[11px] leading-tight"
        style={{ color: BOOK_MODULE_STYLES.text }}
      >
        {book.title}
      </p>
      <p
        className="truncate font-mono text-[10px]"
        style={{ color: BOOK_MODULE_STYLES.muted }}
      >
        <span>{authorsLine || "Unknown author"}</span>
        {book.publishedYear ? (
          <span style={{ color: BOOK_MODULE_STYLES.faint }}> · {book.publishedYear}</span>
        ) : null}
      </p>
    </Link>
  );
};
