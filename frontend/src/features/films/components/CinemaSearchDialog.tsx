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
import { CinemaSearchResults } from "@/features/films/components/cinema-search-dialog/CinemaSearchResults";
import { useMovieSearch } from "@/features/films/hooks/useMovies";
import { useUserSearch } from "@/features/profile/hooks/useProfile";
import { navigateWithViewTransitionFallback } from "@/lib/view-transition";

type CinemaSearchDialogProps = {
  isOpen: boolean;
  onOpenChange: (nextIsOpen: boolean) => void;
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

  const normalizedQueryInput = queryInput.trim();
  const isUserSearchMode = normalizedQueryInput.startsWith("@");
  const usernameQuery = isUserSearchMode ? normalizedQueryInput.slice(1).trim() : "";

  const deferredMovieQuery = useDeferredValue(isUserSearchMode ? "" : normalizedQueryInput);
  const deferredUsernameQuery = useDeferredValue(usernameQuery);

  const movieSuggestionsQuery = useMovieSearch(deferredMovieQuery);
  const userSuggestionsQuery = useUserSearch(deferredUsernameQuery, 8);

  const movieSuggestions = (movieSuggestionsQuery.data ?? []).slice(0, 8);
  const userSuggestions = (userSuggestionsQuery.data ?? []).slice(0, 8);

  const suggestionsCount = isUserSearchMode ? userSuggestions.length : movieSuggestions.length;
  const isLoadingSuggestions = isUserSearchMode
    ? userSuggestionsQuery.isFetching
    : movieSuggestionsQuery.isFetching;
  const hasMinQueryLength = isUserSearchMode
    ? usernameQuery.length >= 1
    : normalizedQueryInput.length >= 2;

  const effectiveHighlightedIndex =
    highlightedIndex >= 0 && highlightedIndex < suggestionsCount
      ? highlightedIndex
      : suggestionsCount > 0
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

    void navigateWithViewTransitionFallback(
      () =>
        navigate({
          to: "/cinema/$tmdbId",
          params: { tmdbId: String(tmdbId) },
          viewTransition: true,
          startTransition: true,
        }),
      () =>
        navigate({
          to: "/cinema/$tmdbId",
          params: { tmdbId: String(tmdbId) },
        }),
    );
  };

  const openUserProfile = (username: string) => {
    closeDialog();

    void navigateWithViewTransitionFallback(
      () =>
        navigate({
          to: "/profile/$username",
          params: { username },
          viewTransition: true,
          startTransition: true,
        }),
      () =>
        navigate({
          to: "/profile/$username",
          params: { username },
        }),
    );
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (!hasMinQueryLength || suggestionsCount === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => (index + 1) % suggestionsCount);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => (index <= 0 ? suggestionsCount - 1 : index - 1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (isUserSearchMode) {
        const selectedUser =
          effectiveHighlightedIndex >= 0
            ? userSuggestions[effectiveHighlightedIndex]
            : userSuggestions[0];

        if (selectedUser) {
          openUserProfile(selectedUser.username);
        }

        return;
      }

      const selectedMovie =
        effectiveHighlightedIndex >= 0
          ? movieSuggestions[effectiveHighlightedIndex]
          : movieSuggestions[0];

      if (selectedMovie) {
        openMovie(selectedMovie.id);
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="theme-modal-overlay fixed inset-0 z-120 bg-background/70 backdrop-blur-sm">
      <button
        type="button"
        onClick={closeDialog}
        className="absolute inset-0"
        aria-label="Close cinema search"
      />

      <div className="relative mx-auto flex h-full w-full max-w-2xl items-start px-4 pt-16 sm:pt-20">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={inputId}
          className="theme-modal-panel w-full overflow-hidden border border-border/80 bg-card/95 shadow-2xl shadow-background/40 backdrop-blur-md animate-fade-up"
        >
          <div className="border-b border-border/70 p-3 sm:p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id={inputId}
                ref={inputRef}
                value={queryInput}
                onChange={(event) => {
                  setQueryInput(event.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Search cinema titles or @username..."
                className="h-10 border-border/75 bg-background/55 pl-8 pr-10 font-mono text-sm"
                autoComplete="off"
                role="combobox"
                aria-expanded={hasMinQueryLength && suggestionsCount > 0}
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
                className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary/55 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                aria-label="Close cinema search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <CinemaSearchResults
            inputId={inputId}
            isUserSearchMode={isUserSearchMode}
            hasMinQueryLength={hasMinQueryLength}
            isLoadingSuggestions={isLoadingSuggestions}
            suggestionsCount={suggestionsCount}
            effectiveHighlightedIndex={effectiveHighlightedIndex}
            userSuggestions={userSuggestions}
            movieSuggestions={movieSuggestions}
            onHoverResult={setHighlightedIndex}
            onSelectUser={openUserProfile}
            onSelectMovie={openMovie}
          />

          <p className="border-t border-border/70 px-4 py-2 font-mono text-[10px] text-muted-foreground">
            Enter opens the highlighted result. Use @ to search profiles. Esc closes search.
          </p>
        </section>
      </div>
    </div>,
    document.body,
  );
};
