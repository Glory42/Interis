import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getPosterUrl } from "@/features/films/components/utils";
import type { TmdbSearchMovie } from "@/types/api";

type FilmSearchProps = {
  query: string;
  onQueryChange: (value: string) => void;
  suggestions: TmdbSearchMovie[];
  isSuggestionsLoading: boolean;
  onSelectSuggestion: (movie: TmdbSearchMovie) => void;
};

const getYear = (releaseDate: string): string | null => {
  if (releaseDate.length < 4) {
    return null;
  }

  return releaseDate.slice(0, 4);
};

export const FilmSearch = ({
  query,
  onQueryChange,
  suggestions,
  isSuggestionsLoading,
  onSelectSuggestion,
}: FilmSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  const hasMinQueryLength = query.trim().length >= 2;
  const effectiveHighlightedIndex =
    highlightedIndex >= 0 && highlightedIndex < suggestions.length
      ? highlightedIndex
      : -1;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) {
        return;
      }

      if (event.target instanceof Node && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
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

      onSelectSuggestion(selectedMovie);
      setIsOpen(false);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick film finder</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div ref={wrapperRef} className="relative">
          <label htmlFor="film-autocomplete" className="mb-1 block text-xs text-muted-foreground">
            Start typing and jump straight to a movie page.
          </label>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="film-autocomplete"
              value={query}
              onChange={(event) => {
                const input = event.target.value;
                onQueryChange(input);
                setIsOpen(input.trim().length >= 2);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (hasMinQueryLength) {
                  setIsOpen(true);
                }
              }}
              placeholder="e.g. The Godfather"
              className="h-10 w-full rounded-lg border border-border bg-input pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              role="combobox"
              aria-expanded={isOpen}
              aria-controls={listboxId}
              aria-activedescendant={
                effectiveHighlightedIndex >= 0
                  ? `${listboxId}-option-${effectiveHighlightedIndex}`
                  : undefined
              }
              aria-autocomplete="list"
              autoComplete="off"
            />
          </div>

          {isOpen && hasMinQueryLength ? (
            <div
              id={listboxId}
              role="listbox"
              className="absolute z-30 mt-2 max-h-96 w-full overflow-auto rounded-xl border border-border/80 bg-card/95 p-2 shadow-2xl backdrop-blur-sm animate-fade-up"
            >
              {isSuggestionsLoading ? (
                <p className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
                  <Spinner /> Finding movies...
                </p>
              ) : null}

              {!isSuggestionsLoading && suggestions.length === 0 ? (
                <p className="px-2 py-2 text-sm text-muted-foreground">
                  No matches yet. Try a different title.
                </p>
              ) : null}

              {!isSuggestionsLoading ? (
                <ul className="space-y-1">
                  {suggestions.map((movie, index) => {
                    const isHighlighted = effectiveHighlightedIndex === index;
                    const year = getYear(movie.release_date);

                    return (
                      <li key={movie.id}>
                        <button
                          id={`${listboxId}-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={isHighlighted}
                          className={
                            "grid w-full grid-cols-[40px_1fr] gap-2 rounded-md border px-2 py-2 text-left transition " +
                            (isHighlighted
                              ? "border-primary/60 bg-primary/15"
                              : "border-border/60 bg-secondary/15 hover:bg-secondary/60")
                          }
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onClick={() => {
                            onSelectSuggestion(movie);
                            setIsOpen(false);
                          }}
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
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          Tip: press <kbd className="rounded bg-secondary px-1 py-0.5">Enter</kbd> to open highlighted result.
        </p>
      </CardContent>
    </Card>
  );
};
