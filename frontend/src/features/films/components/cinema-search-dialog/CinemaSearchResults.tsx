import { Spinner } from "@/components/ui/spinner";
import type { UserSearchResult } from "@/features/profile/api";
import type { TmdbSearchMovie } from "@/types/api";
import { CinemaSearchMovieResultItem } from "@/features/films/components/cinema-search-dialog/CinemaSearchMovieResultItem";
import { CinemaSearchStatusMessage } from "@/features/films/components/cinema-search-dialog/CinemaSearchStatusMessage";
import { CinemaSearchUserResultItem } from "@/features/films/components/cinema-search-dialog/CinemaSearchUserResultItem";

type CinemaSearchResultsProps = {
  inputId: string;
  isUserSearchMode: boolean;
  hasMinQueryLength: boolean;
  isLoadingSuggestions: boolean;
  suggestionsCount: number;
  effectiveHighlightedIndex: number;
  userSuggestions: UserSearchResult[];
  movieSuggestions: TmdbSearchMovie[];
  onHoverResult: (index: number) => void;
  onSelectUser: (username: string) => void;
  onSelectMovie: (tmdbId: number) => void;
};

export const CinemaSearchResults = ({
  inputId,
  isUserSearchMode,
  hasMinQueryLength,
  isLoadingSuggestions,
  suggestionsCount,
  effectiveHighlightedIndex,
  userSuggestions,
  movieSuggestions,
  onHoverResult,
  onSelectUser,
  onSelectMovie,
}: CinemaSearchResultsProps) => {
  return (
    <div id={`${inputId}-results`} className="max-h-[min(62dvh,30rem)] overflow-y-auto p-2 sm:p-2.5">
      {!hasMinQueryLength ? (
        <CinemaSearchStatusMessage
          message={
            isUserSearchMode
              ? "Type at least 1 character after @ to find a profile."
              : "Type at least 2 characters to search the cinema catalog."
          }
        />
      ) : null}

      {hasMinQueryLength && isLoadingSuggestions ? (
        <p className="flex items-center gap-2 px-3 py-4 font-mono text-xs text-muted-foreground">
          <Spinner />
          {isUserSearchMode ? "Finding profiles..." : "Finding titles..."}
        </p>
      ) : null}

      {hasMinQueryLength && !isLoadingSuggestions && suggestionsCount === 0 ? (
        <CinemaSearchStatusMessage
          message={
            isUserSearchMode
              ? "No profile matches yet. Try another username."
              : "No matches yet. Try another title."
          }
        />
      ) : null}

      {!isLoadingSuggestions && hasMinQueryLength && suggestionsCount > 0 ? (
        <ul className="space-y-1" role="listbox">
          {isUserSearchMode
            ? userSuggestions.map((profile, index) => (
                <CinemaSearchUserResultItem
                  key={profile.id}
                  inputId={inputId}
                  index={index}
                  profile={profile}
                  isHighlighted={effectiveHighlightedIndex === index}
                  onHover={onHoverResult}
                  onSelect={onSelectUser}
                />
              ))
            : movieSuggestions.map((movie, index) => (
                <CinemaSearchMovieResultItem
                  key={movie.id}
                  inputId={inputId}
                  index={index}
                  movie={movie}
                  isHighlighted={effectiveHighlightedIndex === index}
                  onHover={onHoverResult}
                  onSelect={onSelectMovie}
                />
              ))}
        </ul>
      ) : null}
    </div>
  );
};
