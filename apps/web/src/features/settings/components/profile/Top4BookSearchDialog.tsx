import { useDeferredValue } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useBookSearch } from "@/features/books/hooks/useBooks";
import type { GoogleBooksVolume } from "@/features/books/api";

type Top4BookSearchDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  onSelectBook: (volume: GoogleBooksVolume) => void;
  isSelectingBook: boolean;
};

const getCoverUrl = (volume: GoogleBooksVolume): string | null => {
  const links = volume.volumeInfo.imageLinks;
  return links?.thumbnail ?? links?.smallThumbnail ?? null;
};

const getPublishedYear = (volume: GoogleBooksVolume): string | null => {
  const date = volume.volumeInfo.publishedDate;
  if (!date) return null;
  return date.slice(0, 4);
};

export const Top4BookSearchDialog = ({
  isOpen,
  onClose,
  query,
  onQueryChange,
  onSelectBook,
  isSelectingBook,
}: Top4BookSearchDialogProps) => {
  const deferredQuery = useDeferredValue(query);
  const searchQuery = useBookSearch(deferredQuery);
  const suggestions = (searchQuery.data ?? []).slice(0, 10);

  if (!isOpen) return null;

  return createPortal(
    <div className="theme-modal-overlay fixed inset-0 z-140 bg-background/70 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Close book picker"
      />

      <div className="relative mx-auto flex h-full w-full max-w-2xl items-start px-4 pt-16 sm:pt-20">
        <section
          role="dialog"
          aria-modal="true"
          className="theme-modal-panel w-full overflow-hidden border border-border/70 bg-card/95 shadow-2xl"
        >
          <div className="border-b border-border/60 p-3 sm:p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search books for this slot..."
                className="h-11 border-border/70 bg-background/45 pl-9 pr-11"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary/55 hover:text-foreground"
                aria-label="Close picker"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[min(62dvh,30rem)] overflow-y-auto p-2 sm:p-3">
            {query.trim().length < 2 ? (
              <p className="border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                Type at least 2 characters to search.
              </p>
            ) : null}

            {query.trim().length >= 2 && searchQuery.isFetching ? (
              <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <Spinner /> Finding books...
              </p>
            ) : null}

            {query.trim().length >= 2 && !searchQuery.isFetching && suggestions.length === 0 ? (
              <p className="border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                No matches found.
              </p>
            ) : null}

            {!searchQuery.isFetching && query.trim().length >= 2 && suggestions.length > 0 ? (
              <ul className="space-y-1">
                {suggestions.map((volume) => {
                  const coverUrl = getCoverUrl(volume);
                  const authors = volume.volumeInfo.authors?.join(", ") ?? "Unknown Author";
                  const year = getPublishedYear(volume);

                  return (
                    <li key={volume.id}>
                      <button
                        type="button"
                        className="grid w-full grid-cols-[42px_1fr] gap-2 border border-border/70 bg-background/30 px-2 py-2 text-left transition-colors hover:bg-secondary/45"
                        onClick={() => onSelectBook(volume)}
                        disabled={isSelectingBook}
                      >
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={`${volume.volumeInfo.title} cover`}
                            className="h-14 w-10 object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-14 w-10 items-center justify-center bg-muted/30">
                            <BookOpen className="h-5 w-5 text-muted-foreground/50" style={{ color: "var(--module-book)" }} />
                          </div>
                        )}
                        <span className="space-y-0.5">
                          <span className="line-clamp-1 block text-sm font-semibold text-foreground">
                            {volume.volumeInfo.title}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {authors}{year ? ` · ${year}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
};
