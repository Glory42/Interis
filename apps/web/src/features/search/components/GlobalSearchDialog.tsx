import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { ModalShell } from "@/components/ui/ModalShell";
import { SentenceSelect } from "@/components/ui/SentenceSelect";
import { scopeOptions, type SearchScope } from "@/features/search/components/global-search/constants";
import { GlobalSearchResults } from "@/features/search/components/global-search/GlobalSearchResults";
import { openSearchEntry } from "@/features/search/components/global-search/navigation";
import type { SearchResultEntry } from "@/features/search/components/global-search/types";
import { useGlobalSearchState } from "@/features/search/components/global-search/useGlobalSearchState";
import { clearRecentSearches, pushRecentSearch, readRecentSearches } from "@/features/search/recent-searches";
import { PHONE_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { navigateWithViewTransitionFallback } from "@/lib/view-transition";

type GlobalSearchDialogProps = {
  isOpen: boolean;
  onOpenChange: (nextIsOpen: boolean) => void;
};

const SCOPE_BY_KEY: Record<string, SearchScope> = { "1": "movie", "2": "serials", "3": "users" };

export const GlobalSearchDialog = ({ isOpen, onOpenChange }: GlobalSearchDialogProps) => {
  const navigate = useNavigate();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [, setRecentVersion] = useState(0);
  const state = useGlobalSearchState();
  const scope: SearchScope = state.scopedTarget ?? "everything";
  const recentSearches = isOpen && state.normalizedQuery.length === 0 ? readRecentSearches() : [];

  const closeDialog = () => {
    state.reset();
    onOpenChange(false);
  };

  // Leaves the dialog, then navigates with a view transition when the browser supports one.
  const go = (navigateTo: (withTransition: boolean) => Promise<void>) => {
    closeDialog();
    void navigateWithViewTransitionFallback(() => navigateTo(true), () => navigateTo(false));
  };
  const transition = (withTransition: boolean) => (withTransition ? { viewTransition: true, startTransition: true } : {});

  const openEntry = (entry: SearchResultEntry) => {
    pushRecentSearch(state.normalizedQuery);
    openSearchEntry(entry, {
      openMovie: (tmdbId) =>
        go((withTransition) => navigate({ to: "/movies/$tmdbId", params: { tmdbId: String(tmdbId) }, ...transition(withTransition) })),
      openSerial: (tmdbId) =>
        go((withTransition) => navigate({ to: "/serials/$tmdbId", params: { tmdbId: String(tmdbId) }, ...transition(withTransition) })),
      openUser: (username) =>
        go((withTransition) => navigate({ to: "/profile/$username", params: { username }, ...transition(withTransition) })),
    });
  };

  const pickRecent = (query: string) => {
    state.setQueryInput(query);
    state.setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  // Focus returns to the input so typing carries on after a pick from the scope menu.
  const setScope = (next: SearchScope) => {
    state.setScope(next === "everything" ? null : next);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(focusFrame);
    };
  }, [isOpen]);

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && SCOPE_BY_KEY[event.key]) {
      event.preventDefault();
      setScope(SCOPE_BY_KEY[event.key]!);
      return;
    }
    if (event.key === "Enter" && state.normalizedQuery.length === 0 && recentSearches[0]) {
      event.preventDefault();
      pickRecent(recentSearches[0]);
      return;
    }
    if (!state.shouldRunSearch || state.suggestionsCount === 0) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      state.setHighlightedIndex((index) => (index + step + state.suggestionsCount) % state.suggestionsCount);
      return;
    }
    if (event.key === "Tab" && !event.shiftKey) {
      // Jump to the first result of the next section, wrapping around.
      const current = state.effectiveHighlightedIndex;
      const next = state.sectionOffsets.find(({ startIndex, section }) => startIndex > current && section.items.length > 0);
      event.preventDefault();
      state.setHighlightedIndex(next ? next.startIndex : 0);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const selected = state.visibleEntries[Math.max(0, state.effectiveHighlightedIndex)];
      if (selected) openEntry(selected);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      onClose={closeDialog}
      layout={isPhone ? "fullscreen" : "dialog"}
      overlayClassName="z-120"
      containerClassName={isPhone ? undefined : "max-w-2xl items-start px-4 pt-16 sm:pt-20"}
      ariaCloseLabel="Close search"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className={cn(
          "flex w-full flex-col overflow-hidden bg-background animate-fade-up",
          isPhone ? "h-dvh" : "max-h-[min(80dvh,40rem)] rounded-[3px] border border-[color:var(--line-strong)] shadow-2xl",
        )}
      >
        <div className="flex items-center gap-3 border-b border-[color:var(--line)] px-4 py-3">
          <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <input
            id={inputId}
            ref={inputRef}
            value={state.queryInput}
            onChange={(event) => {
              state.setQueryInput(event.target.value);
              state.setHighlightedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Films, shows, members"
            className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
            autoComplete="off"
            role="combobox"
            aria-expanded={state.hasMinQueryLength && state.suggestionsCount > 0}
            aria-controls={`${inputId}-results`}
            aria-activedescendant={
              state.effectiveHighlightedIndex >= 0 ? `${inputId}-result-${state.effectiveHighlightedIndex}` : undefined
            }
            aria-autocomplete="list"
          />
          {isPhone ? (
            <button type="button" onClick={closeDialog} className="body-s shrink-0 text-foreground">
              Cancel
            </button>
          ) : (
            <span className="body-s shrink-0 text-muted-foreground">
              {"in "}
              <SentenceSelect value={scope} options={scopeOptions} onChange={setScope} />
            </span>
          )}
        </div>
        {isPhone ? (
          <p className="body-s px-4 pt-2 text-muted-foreground">
            {"in "}
            <SentenceSelect value={scope} options={scopeOptions} onChange={setScope} />
          </p>
        ) : null}

        <div id={`${inputId}-results`} className="min-h-0 flex-1 overflow-y-auto py-1">
          <GlobalSearchResults
            inputId={inputId}
            normalizedQuery={state.normalizedQuery}
            hasMinQueryLength={state.hasMinQueryLength}
            sectionOffsets={state.sectionOffsets}
            suggestionsCount={state.suggestionsCount}
            isAnyLoading={state.isAnyLoading}
            effectiveHighlightedIndex={state.effectiveHighlightedIndex}
            recentSearches={recentSearches}
            onPickRecent={pickRecent}
            onClearRecent={() => {
              clearRecentSearches();
              setRecentVersion((version) => version + 1);
            }}
            onHoverIndex={state.setHighlightedIndex}
            onSelectEntry={openEntry}
          />
        </div>

        {isPhone ? null : (
          <div className="slate mono-meta uppercase">
            <span>↑↓ move · ↵ open · ⇥ next section · ⌘1–3 scope</span>
            {state.hasMinQueryLength ? <span>{`${state.suggestionsCount} results`}</span> : <span>esc</span>}
          </div>
        )}
      </section>
    </ModalShell>
  );
};
