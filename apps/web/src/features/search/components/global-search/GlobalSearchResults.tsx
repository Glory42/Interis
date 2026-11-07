import { RotateCcw } from "lucide-react";
import { MIN_QUERY_LENGTH } from "./constants";
import { SearchResultRow } from "./SearchResultRow";
import type { SearchResultEntry, SearchSectionOffset } from "./types";

type GlobalSearchResultsProps = {
  inputId: string;
  normalizedQuery: string;
  hasMinQueryLength: boolean;
  sectionOffsets: SearchSectionOffset[];
  suggestionsCount: number;
  isAnyLoading: boolean;
  effectiveHighlightedIndex: number;
  recentSearches: string[];
  onPickRecent: (query: string) => void;
  onClearRecent: () => void;
  onHoverIndex: (index: number) => void;
  onSelectEntry: (entry: SearchResultEntry) => void;
};

const Divider = ({ label, action }: { label: string; action?: React.ReactNode }) => (
  <div className="mono-meta flex items-center gap-2 px-4 pt-2 pb-1 uppercase text-muted-foreground">
    <span>{label}</span>
    <span aria-hidden className="h-px flex-1 bg-[color:var(--line)]" />
    {action}
  </div>
);

const SkeletonRows = () => (
  <div aria-hidden className="space-y-2 px-4 py-2">
    {[60, 35, 48].map((width) => (
      <div key={width} className="h-3 animate-pulse rounded-[2px] bg-muted/30" style={{ width: `${width}%` }} />
    ))}
  </div>
);

export const GlobalSearchResults = ({
  inputId,
  normalizedQuery,
  hasMinQueryLength,
  sectionOffsets,
  suggestionsCount,
  isAnyLoading,
  effectiveHighlightedIndex,
  recentSearches,
  onPickRecent,
  onClearRecent,
  onHoverIndex,
  onSelectEntry,
}: GlobalSearchResultsProps) => {
  if (normalizedQuery.length === 0) {
    return recentSearches.length > 0 ? (
      <div>
        <Divider
          label="Recent"
          action={
            <button type="button" onClick={onClearRecent} className="hover:text-foreground">
              Clear
            </button>
          }
        />
        <ul>
          {recentSearches.map((query) => (
            <li key={query}>
              <button
                type="button"
                onClick={() => onPickRecent(query)}
                className="body-s flex w-full items-center gap-3 px-4 py-2 text-left text-foreground hover:bg-foreground/5"
              >
                <RotateCcw aria-hidden className="size-3.5 text-muted-foreground" />
                {query}
              </button>
            </li>
          ))}
        </ul>
      </div>
    ) : (
      <p className="body-s px-4 py-3 text-muted-foreground">Search films, TV and members.</p>
    );
  }

  if (!hasMinQueryLength) {
    return <p className="body-s px-4 py-3 text-muted-foreground">{`Type at least ${MIN_QUERY_LENGTH} characters to search.`}</p>;
  }

  const visibleSections = sectionOffsets.filter(({ section }) => section.items.length > 0 || section.isError);

  return (
    <div className="pb-1">
      {isAnyLoading && suggestionsCount === 0 ? (
        <>
          <Divider label="Searching TMDB" />
          <SkeletonRows />
        </>
      ) : null}

      {visibleSections.map(({ section, startIndex }) => (
        <section key={section.target} role="group" aria-label={section.label}>
          <Divider label={section.label} action={<span>{section.items.length}</span>} />
          {section.items.length > 0 ? (
            <ul role="listbox" aria-label={section.label}>
              {section.items.map((entry, index) => (
                <SearchResultRow
                  key={entry.id}
                  inputId={inputId}
                  entry={entry}
                  index={startIndex + index}
                  isHighlighted={effectiveHighlightedIndex === startIndex + index}
                  onHover={onHoverIndex}
                  onSelect={onSelectEntry}
                />
              ))}
            </ul>
          ) : (
            <p className="body-s px-4 py-2 text-[color:var(--danger)]">{`Could not load ${section.label.toLowerCase()} right now.`}</p>
          )}
        </section>
      ))}

      {!isAnyLoading && visibleSections.length === 0 ? (
        <div className="px-4 py-3">
          <p className="display-4 text-foreground">{`Nothing in the reel for “${normalizedQuery}”.`}</p>
          <p className="body-s mt-1 text-muted-foreground">Titles come from TMDB. Check the spelling, or try the original title.</p>
        </div>
      ) : null}
    </div>
  );
};
