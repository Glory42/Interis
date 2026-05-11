import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { BOOK_MODULE_STYLES } from "@/features/books/components/books-detail/styles";

type BookDetailTopBarProps = {
  title: string;
};

export const BookDetailTopBar = ({ title }: BookDetailTopBarProps) => {
  return (
    <div
      className="sticky top-0 z-10 border-b px-4 py-3"
      style={{
        borderColor: BOOK_MODULE_STYLES.border,
        background: BOOK_MODULE_STYLES.panel,
      }}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
        <Link
          to="/books"
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors"
          style={{ color: BOOK_MODULE_STYLES.muted }}
          viewTransition
        >
          <ChevronLeft className="h-3 w-3" />
          Books
        </Link>
        <span style={{ color: BOOK_MODULE_STYLES.faint }}>·</span>
        <span
          className="truncate font-mono text-[11px]"
          style={{ color: BOOK_MODULE_STYLES.text }}
        >
          {title}
        </span>
      </div>
    </div>
  );
};
