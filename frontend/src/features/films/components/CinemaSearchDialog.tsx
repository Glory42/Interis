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
import { useUserSearch } from "@/features/profile/hooks/useProfile";
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

  const normalizedQueryInput = queryInput.trim();
  const isUserSearchMode = normalizedQueryInput.startsWith("@");
  const usernameQuery = isUserSearchMode
    ? normalizedQueryInput.slice(1).trim()
    : "";

  const deferredMovieQuery = useDeferredValue(
    isUserSearchMode ? "" : normalizedQueryInput,
  );
  const deferredUsernameQuery = useDeferredValue(usernameQuery);

  const movieSuggestionsQuery = useMovieSearch(deferredMovieQuery);
  const userSuggestionsQuery = useUserSearch(deferredUsernameQuery, 8);

  const movieSuggestions = (movieSuggestionsQuery.data ?? []).slice(0, 8);
  const userSuggestions = (userSuggestionsQuery.data ?? []).slice(0, 8);

  const suggestionsCount = isUserSearchMode
    ? userSuggestions.length
    : movieSuggestions.length;
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
    void navigate({
      to: "/cinema/$tmdbId",
      params: { tmdbId: String(tmdbId) },
      viewTransition: true,
      startTransition: true,
    });
  };

  const openUserProfile = (username: string) => {
    closeDialog();
    void navigate({
      to: "/profile/$username",
      params: { username },
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
      setHighlightedIndex((index) =>
        index <= 0 ? suggestionsCount - 1 : index - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (isUserSearchMode) {
        const selectedUser =
          effectiveHighlightedIndex >= 0
            ? userSuggestions[effectiveHighlightedIndex]
            : userSuggestions[0];

        if (!selectedUser) {
          return;
        }

        openUserProfile(selectedUser.username);
        return;
      }

      const selectedMovie =
        effectiveHighlightedIndex >= 0
          ? movieSuggestions[effectiveHighlightedIndex]
          : movieSuggestions[0];

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
    <div className="theme-modal-overlay fixed inset-0 z-[120] bg-background/65 backdrop-blur-sm">
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
          className="theme-modal-panel w-full overflow-hidden rounded-sm border border-border/70 bg-card/95 shadow-2xl shadow-background/40 backdrop-blur-xl animate-fade-up"
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
                placeholder="Search cinema titles or @username..."
                className="h-11 rounded-xl border-border/70 bg-background/45 pl-9 pr-11"
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
                {isUserSearchMode
                  ? "Type at least 1 character after @ to find a profile."
                  : "Type at least 2 characters to search the cinema catalog."}
              </p>
            ) : null}

            {hasMinQueryLength && isLoadingSuggestions ? (
              <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <Spinner />
                {isUserSearchMode ? "Finding profiles..." : "Finding titles..."}
              </p>
            ) : null}

            {hasMinQueryLength &&
            !isLoadingSuggestions &&
            suggestionsCount === 0 ? (
              <p className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                {isUserSearchMode
                  ? "No profile matches yet. Try another username."
                  : "No matches yet. Try another title."}
              </p>
            ) : null}

            {!isLoadingSuggestions &&
            hasMinQueryLength &&
            suggestionsCount > 0 ? (
              <ul className="space-y-1" role="listbox">
                {isUserSearchMode
                  ? userSuggestions.map((profile, index) => {
                      const isHighlighted = effectiveHighlightedIndex === index;
                      const profileAvatar =
                        profile.avatarUrl ?? profile.image ?? null;
                      const profileName =
                        profile.displayUsername?.trim() || profile.username;

                      return (
                        <li key={profile.id}>
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
                            onClick={() => openUserProfile(profile.username)}
                          >
                            {profileAvatar ? (
                              <img
                                src={profileAvatar}
                                alt={`${profile.username} avatar`}
                                className="h-10 w-10 rounded-full border border-border/60 object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-secondary text-xs font-semibold text-secondary-foreground">
                                {profile.username.slice(0, 1).toUpperCase()}
                              </span>
                            )}

                            <span className="space-y-0.5">
                              <span className="line-clamp-1 block text-sm font-semibold text-foreground">
                                {profileName}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                @{profile.username}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })
                  : movieSuggestions.map((movie, index) => {
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
            Enter opens the highlighted result. Use @ to search profiles. Esc
            closes search.
          </p>
        </section>
      </div>
    </div>,
    document.body,
  );
};
