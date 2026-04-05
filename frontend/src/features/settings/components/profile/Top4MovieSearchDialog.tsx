import { useDeferredValue } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getPosterUrl, toReleaseYear } from "@/features/films/components/utils";
import { useMovieSearch } from "@/features/films/hooks/useMovies";
import type { TmdbSearchMovie } from "@/types/api";

type Top4MovieSearchDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  onSelectMovie: (movie: TmdbSearchMovie) => void;
  isSelectingMovie: boolean;
};

export const Top4MovieSearchDialog = ({
  isOpen,
  onClose,
  query,
  onQueryChange,
  onSelectMovie,
  isSelectingMovie,
}: Top4MovieSearchDialogProps) => {
  const deferredQuery = useDeferredValue(query);
  const searchQuery = useMovieSearch(deferredQuery);
  const suggestions = (searchQuery.data ?? []).slice(0, 10);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="theme-modal-overlay fixed inset-0 z-[140] bg-background/70 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Close movie picker"
      />

      <div className="relative mx-auto flex h-full w-full max-w-2xl items-start px-4 pt-16 sm:pt-20">
        <section
          role="dialog"
          aria-modal="true"
          className="theme-modal-panel w-full overflow-hidden  border border-border/70 bg-card/95 shadow-2xl"
        >
          <div className="border-b border-border/60 p-3 sm:p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search movies for this slot..."
                className="h-11  border-border/70 bg-background/45 pl-9 pr-11"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center  text-muted-foreground transition-colors hover:bg-secondary/55 hover:text-foreground"
                aria-label="Close picker"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[min(62dvh,30rem)] overflow-y-auto p-2 sm:p-3">
            {query.trim().length < 2 ? (
              <p className=" border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                Type at least 2 characters to search.
              </p>
            ) : null}

            {query.trim().length >= 2 && searchQuery.isFetching ? (
              <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <Spinner /> Finding movies...
              </p>
            ) : null}

            {query.trim().length >= 2 &&
            !searchQuery.isFetching &&
            suggestions.length === 0 ? (
              <p className=" border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                No matches found.
              </p>
            ) : null}

            {!searchQuery.isFetching && query.trim().length >= 2 && suggestions.length > 0 ? (
              <ul className="space-y-1">
                {suggestions.map((movie) => {
                  const releaseYear = toReleaseYear(movie.release_date);

                  return (
                    <li key={movie.id}>
                      <button
                        type="button"
                        className="grid w-full grid-cols-[42px_1fr] gap-2  border border-border/70 bg-background/30 px-2 py-2 text-left transition-colors hover:bg-secondary/45"
                        onClick={() => onSelectMovie(movie)}
                        disabled={isSelectingMovie}
                      >
                        <img
                          src={getPosterUrl(movie.poster_path)}
                          alt={`${movie.title} poster`}
                          className="h-14 w-10  object-cover"
                          loading="lazy"
                        />
                        <span className="space-y-0.5">
                          <span className="line-clamp-1 block text-sm font-semibold text-foreground">
                            {movie.title}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {releaseYear ?? "Unknown year"}
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
