import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { scopedPlaceholder } from "@/features/search/components/global-search/constants";
import { GlobalSearchResults } from "@/features/search/components/global-search/GlobalSearchResults";
import { openSearchEntry } from "@/features/search/components/global-search/navigation";
import { useGlobalSearchState } from "@/features/search/components/global-search/useGlobalSearchState";
import { navigateWithViewTransitionFallback } from "@/lib/view-transition";

type GlobalSearchDialogProps = {
  isOpen: boolean;
  onOpenChange: (nextIsOpen: boolean) => void;
};

export const GlobalSearchDialog = ({
  isOpen,
  onOpenChange,
}: GlobalSearchDialogProps) => {
  const navigate = useNavigate();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const state = useGlobalSearchState();

  const focusInput = () => {
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const closeDialog = () => {
    state.reset();
    onOpenChange(false);
  };

  const openCinema = (tmdbId: number) => {
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

  const openSerial = (tmdbId: number) => {
    closeDialog();

    void navigateWithViewTransitionFallback(
      () =>
        navigate({
          to: "/serials/$tmdbId",
          params: { tmdbId: String(tmdbId) },
          viewTransition: true,
          startTransition: true,
        }),
      () =>
        navigate({
          to: "/serials/$tmdbId",
          params: { tmdbId: String(tmdbId) },
        }),
    );
  };

  const openUser = (username: string) => {
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

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (!state.shouldRunSearch || state.suggestionsCount === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      state.setHighlightedIndex((index) => (index + 1) % state.suggestionsCount);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      state.setHighlightedIndex((index) =>
        index <= 0 ? state.suggestionsCount - 1 : index - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const selectedEntry =
        state.effectiveHighlightedIndex >= 0
          ? state.visibleEntries[state.effectiveHighlightedIndex]
          : state.visibleEntries[0];

      if (!selectedEntry) {
        return;
      }

      openSearchEntry(selectedEntry, { openCinema, openSerial, openUser });
    }
  };

  if (!isOpen) {
    return null;
  }

  const currentPlaceholder =
    state.isScopedMode && state.scopedTarget
      ? scopedPlaceholder[state.scopedTarget]
      : "Search users, cinema, serials...";

  return createPortal(
    <div className="theme-modal-overlay fixed inset-0 z-120 bg-background/75 backdrop-blur-sm">
      <button
        type="button"
        onClick={closeDialog}
        className="absolute inset-0"
        aria-label="Close search"
      />

      <div className="relative mx-auto flex h-full w-full max-w-2xl items-start px-4 pt-16 sm:pt-20">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={inputId}
          className="theme-modal-panel w-full overflow-hidden border border-border/80 bg-card/95 shadow-2xl shadow-background/45 animate-fade-up"
        >
          <div
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(0, 255, 136, 0.35), rgba(0, 207, 255, 0.22), transparent)",
            }}
          />

          <div className="border-b border-border/70 px-4 py-3">
            <div className="flex items-center gap-3">
              {state.isScopedMode ? (
                <button
                  type="button"
                  onClick={() => {
                    state.returnToHomeMode();
                    focusInput();
                  }}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary/45 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  aria-label="Back to global search"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : null}

              <Search className="h-4 w-4 shrink-0 text-muted-foreground/45" />

              <Input
                id={inputId}
                ref={inputRef}
                value={state.queryInput}
                onChange={(event) => {
                  state.setQueryInput(event.target.value);
                  state.setHighlightedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder={currentPlaceholder}
                className="h-8 border-0 bg-transparent px-0 font-mono text-[12px] shadow-none focus-visible:ring-0"
                autoComplete="off"
                role="combobox"
                aria-expanded={state.hasMinQueryLength && state.suggestionsCount > 0}
                aria-controls={`${inputId}-results`}
                aria-activedescendant={
                  state.effectiveHighlightedIndex >= 0
                    ? `${inputId}-result-${state.effectiveHighlightedIndex}`
                    : undefined
                }
                aria-autocomplete="list"
              />

              <div className="ml-auto flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground"
                  aria-label="Close search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div
            id={`${inputId}-results`}
            className="max-h-[min(62dvh,32rem)] overflow-y-auto py-2"
          >
            <GlobalSearchResults
              inputId={inputId}
              normalizedQuery={state.normalizedQuery}
              hasMinQueryLength={state.hasMinQueryLength}
              isScopedMode={state.isScopedMode}
              scopedTarget={state.scopedTarget}
              sectionOffsets={state.sectionOffsets}
              suggestionsCount={state.suggestionsCount}
              isAnyLoading={state.isAnyLoading}
              effectiveHighlightedIndex={state.effectiveHighlightedIndex}
              onHoverIndex={state.setHighlightedIndex}
              onSelectEntry={(entry) => {
                openSearchEntry(entry, { openCinema, openSerial, openUser });
              }}
              onEnterScope={(target) => {
                state.enterScopedMode(target);
                focusInput();
              }}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border/70 px-4 py-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/45">
              NULL://SEARCH
            </span>
            <span className="font-mono text-[9px] text-muted-foreground/45">esc to close</span>
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
};
