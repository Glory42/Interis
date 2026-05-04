import { ArrowRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { MIN_QUERY_LENGTH, quickLinks, scopedEmptyPrompt } from "./constants";
import { SearchResultRow } from "./SearchResultRow";
import type {
  ScopedTarget,
  SearchResultEntry,
  SearchSectionOffset,
} from "./types";

type GlobalSearchResultsProps = {
  inputId: string;
  normalizedQuery: string;
  hasMinQueryLength: boolean;
  isScopedMode: boolean;
  scopedTarget: ScopedTarget | null;
  sectionOffsets: SearchSectionOffset[];
  suggestionsCount: number;
  isAnyLoading: boolean;
  effectiveHighlightedIndex: number;
  onHoverIndex: (index: number) => void;
  onSelectEntry: (entry: SearchResultEntry) => void;
  onEnterScope: (target: ScopedTarget) => void;
};

export const GlobalSearchResults = ({
  inputId,
  normalizedQuery,
  hasMinQueryLength,
  isScopedMode,
  scopedTarget,
  sectionOffsets,
  suggestionsCount,
  isAnyLoading,
  effectiveHighlightedIndex,
  onHoverIndex,
  onSelectEntry,
  onEnterScope,
}: GlobalSearchResultsProps) => {
  if (normalizedQuery.length === 0) {
    if (isScopedMode && scopedTarget) {
      return (
        <p className="mx-3 border border-dashed border-border/70 px-3 py-4 font-mono text-xs text-muted-foreground">
          {scopedEmptyPrompt[scopedTarget]}
        </p>
      );
    }

    return (
      <div>
        {quickLinks.map((link) => {
          const Icon = link.icon;

          return (
            <button
              key={link.target}
              type="button"
              className="group flex w-full items-center gap-3 border-b border-border/45 px-4 py-3 text-left transition-colors hover:bg-secondary/20"
              onClick={() => {
                onEnterScope(link.target);
              }}
            >
              <span
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center border"
                style={{
                  borderColor: `color-mix(in srgb, ${link.color} 40%, transparent)`,
                  background: link.tint,
                }}
              >
                <Icon className="h-4 w-4" style={{ color: link.color }} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[11px] font-semibold text-foreground">
                  {link.title}
                </span>
                <span className="block font-mono text-[9px] text-muted-foreground/80">
                  {link.description}
                </span>
              </span>

              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/45 transition-transform group-hover:translate-x-0.5" />
            </button>
          );
        })}
      </div>
    );
  }

  if (!hasMinQueryLength) {
    return (
      <p className="mx-3 border border-dashed border-border/70 px-3 py-4 font-mono text-xs text-muted-foreground">
        Type at least {MIN_QUERY_LENGTH} characters to search.
      </p>
    );
  }

  return (
    <div className="space-y-3 px-2 pb-2">
      {isAnyLoading && suggestionsCount === 0 ? (
        <p className="mx-1 flex items-center gap-2 border border-border/70 px-3 py-3 font-mono text-xs text-muted-foreground">
          <Spinner /> Searching...
        </p>
      ) : null}

      {isScopedMode
        ? (() => {
            const scopedSection = sectionOffsets[0];
            if (!scopedSection) {
              return null;
            }

            if (scopedSection.section.items.length > 0) {
              return (
                <ul className="space-y-1" role="listbox">
                  {scopedSection.section.items.map((entry, index) => (
                    <SearchResultRow
                      key={entry.id}
                      inputId={inputId}
                      entry={entry}
                      index={index}
                      isHighlighted={effectiveHighlightedIndex === index}
                      onHover={onHoverIndex}
                      onSelect={onSelectEntry}
                    />
                  ))}
                </ul>
              );
            }

            if (scopedSection.section.isError) {
              return (
                <p className="mx-1 border border-destructive/35 bg-destructive/8 px-3 py-3 font-mono text-xs text-destructive">
                  Could not load {scopedSection.section.label.toLowerCase()} results.
                </p>
              );
            }

            return null;
          })()
        : sectionOffsets.map(({ section, startIndex }) => {
            const hasItems = section.items.length > 0;

            if (!hasItems && !section.isError) {
              return null;
            }

            return (
              <section key={section.target} className="space-y-1">
                <p className="px-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/55">
                  {section.label}
                </p>

                {hasItems ? (
                  <ul className="space-y-1" role="listbox">
                    {section.items.map((entry, index) => {
                      const globalIndex = startIndex + index;

                      return (
                        <SearchResultRow
                          key={entry.id}
                          inputId={inputId}
                          entry={entry}
                          index={globalIndex}
                          isHighlighted={effectiveHighlightedIndex === globalIndex}
                          onHover={onHoverIndex}
                          onSelect={onSelectEntry}
                        />
                      );
                    })}
                  </ul>
                ) : null}

                {!hasItems && section.isError ? (
                  <p className="mx-1 border border-destructive/35 bg-destructive/8 px-3 py-2 font-mono text-[10px] text-destructive">
                    Could not load {section.label.toLowerCase()} results.
                  </p>
                ) : null}
              </section>
            );
          })}

      {!isAnyLoading &&
      !sectionOffsets.some(({ section }) => section.isError) &&
      suggestionsCount === 0 ? (
        <p className="mx-1 border border-border/70 px-3 py-3 font-mono text-xs text-muted-foreground">
          {isScopedMode
            ? "No matches found for this scope."
            : "No matches found across users, cinema, and serials."}
        </p>
      ) : null}
    </div>
  );
};
