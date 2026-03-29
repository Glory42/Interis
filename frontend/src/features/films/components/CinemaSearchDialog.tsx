import {
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getPosterUrl } from "@/features/films/components/utils";
import { useMovieSearch } from "@/features/films/hooks/useMovies";
import { cn } from "@/lib/utils";

type CinemaSearchDialogProps = {
  isOpen: boolean;
  onOpenChange: (nextIsOpen: boolean) => void;
};

const getReleaseYear = (releaseDate: string): string | null => {
  if (releaseDate.length < 4) {
    return null;
  }

  return releaseDate.slice(0, 4);
};

export const CinemaSearchDialog = ({
  isOpen,
  onOpenChange,
}: CinemaSearchDialogProps) => {
  const navigate = useNavigate();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [queryInput, setQueryInput] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const deferredQueryInput = useDeferredValue(queryInput);
  const suggestionsQuery = useMovieSearch(deferredQueryInput);
  const suggestions = (suggestionsQuery.data ?? []).slice(0, 8);

  const hasMinQueryLength = queryInput.trim().length >= 2;
  const effectiveHighlightedIndex =
    highlightedIndex >= 0 && highlightedIndex < suggestions.length
      ? highlightedIndex
      : suggestions.length > 0
        ? 0
        : -1;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frame);
    };
  }, [isOpen]);

  const closeDialog = () => {
    setQueryInput("");
    setHighlightedIndex(0);
    onOpenChange(false);
  };

  const openMovie = (tmdbId: number) => {
    closeDialog();
    void navigate({
      to: "/films/$tmdbId",
      params: { tmdbId: String(tmdbId) },
      viewTransition: true,
      startTransition: true,
    });
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (!hasMinQueryLength || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => (index + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        index <= 0 ? suggestions.length - 1 : index - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selectedMovie =
        effectiveHighlightedIndex >= 0
          ? suggestions[effectiveHighlightedIndex]
          : suggestions[0];

      if (!selectedMovie) {
        return;
      }

      openMovie(selectedMovie.id);
    }
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-120 bg-background/65 backdrop-blur-sm">
      <button
        type="button"
        onClick={closeDialog}
        className="absolute inset-0"
        aria-label="Close cinema search"
      />

      <div className="relative mx-auto flex h-full w-full max-w-2xl items-start px-4 pt-18 sm:pt-20">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={inputId}
          className="w-full overflow-hidden rounded-sm border border-border/70 bg-card/95 shadow-2xl shadow-background/40 backdrop-blur-xl animate-fade-up"
        >
          <div className="border-b border-border/60 p-3 sm:p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id={inputId}
                ref={inputRef}
                value={queryInput}
                onChange={(event) => {
                  setQueryInput(event.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Search cinema titles..."
                className="h-11 rounded-xl border-border/70 bg-background/45 pl-9 pr-11"
                autoComplete="off"
                role="combobox"
                aria-expanded={hasMinQueryLength && suggestions.length > 0}
                aria-controls={`${inputId}-results`}
                aria-activedescendant={
                  effectiveHighlightedIndex >= 0
                    ? `${inputId}-result-${effectiveHighlightedIndex}`
                    : undefined
                }
                aria-autocomplete="list"
              />
              <button
                type="button"
                onClick={closeDialog}
                className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary/55 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                aria-label="Close cinema search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            id={`${inputId}-results`}
            className="max-h-[min(62dvh,30rem)] overflow-y-auto p-2 sm:p-3"
          >
            {!hasMinQueryLength ? (
              <p className="rounded-sm border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                Type at least 2 characters to search the cinema catalog.
              </p>
            ) : null}

            {hasMinQueryLength && suggestionsQuery.isFetching ? (
              <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <Spinner /> Finding titles...
              </p>
            ) : null}

            {hasMinQueryLength &&
            !suggestionsQuery.isFetching &&
            suggestions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                No matches yet. Try another title.
              </p>
            ) : null}

            {!suggestionsQuery.isFetching &&
            hasMinQueryLength &&
            suggestions.length > 0 ? (
              <ul className="space-y-1" role="listbox">
                {suggestions.map((movie, index) => {
                  const isHighlighted = effectiveHighlightedIndex === index;
                  const year = getReleaseYear(movie.release_date);

                  return (
                    <li key={movie.id}>
                      <button
                        id={`${inputId}-result-${index}`}
                        type="button"
                        role="option"
                        aria-selected={isHighlighted}
                        className={cn(
                          "grid w-full grid-cols-[42px_1fr] gap-2 rounded-lg border px-2 py-2 text-left transition-colors",
                          isHighlighted
                            ? "border-primary/40 bg-primary/12"
                            : "border-border/70 bg-background/30 hover:bg-secondary/45",
                        )}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => openMovie(movie.id)}
                      >
                        <img
                          src={getPosterUrl(movie.poster_path)}
                          alt={`${movie.title} poster`}
                          className="h-14 w-10 rounded object-cover"
                          loading="lazy"
                        />

                        <span className="space-y-0.5">
                          <span className="line-clamp-1 block text-sm font-semibold text-foreground">
                            {movie.title}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {year ?? "Unknown year"}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <p className="border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
            Enter opens the highlighted result. Esc closes search.
          </p>
        </section>
      </div>
    </div>,
    document.body,
  );
};
