import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArchiveFilterControls } from "@/features/media/archive/ArchiveFilterControls";
import { ArchiveSkeletonGrid } from "@/features/media/archive/ArchiveSkeletonGrid";
import type { MediaModuleStyles } from "@/features/media/styles";
import type { ArchiveMenuKey } from "@/features/media/types";

type ArchiveFilterOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type MediaArchivePageProps<TItem, TSort extends string, TPeriod extends string> = {
  moduleStyles: MediaModuleStyles;
  heading: string;
  // The rotating reel above the filters.
  spotlight: ReactNode;
  archiveErrorMessage: string;
  emptyMessage: string;
  endOfArchiveMessage: string;
  archiveCountLabel: string;
  selectedGenre: string;
  selectedLanguage: string;
  selectedSort: TSort;
  selectedPeriod: TPeriod;
  isPeriodDisabled: boolean;
  availableGenres?: ReadonlyArray<{ name: string; count?: number | null }>;
  sortOptions: ReadonlyArray<ArchiveFilterOption<TSort>>;
  periodOptions: ReadonlyArray<ArchiveFilterOption<TPeriod>>;
  languageOptions: ReadonlyArray<ArchiveFilterOption<string>>;
  onSelectGenre: (genre: string) => void;
  onSelectSort: (sort: TSort) => void;
  onSelectLanguage: (language: string) => void;
  onSelectPeriod: (period: TPeriod) => void;
  isPending: boolean;
  isError: boolean;
  items: TItem[];
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  onFetchNextPage: () => void;
  loadingMoreSlot?: ReactNode;
  renderCard: (item: TItem, index: number, className: string | undefined, style: { animationDelay: string } | undefined) => ReactNode;
};

export function MediaArchivePage<TItem, TSort extends string, TPeriod extends string>({
  moduleStyles,
  heading,
  spotlight,
  archiveErrorMessage,
  emptyMessage,
  endOfArchiveMessage,
  archiveCountLabel,
  selectedGenre,
  selectedLanguage,
  selectedSort,
  selectedPeriod,
  isPeriodDisabled,
  availableGenres,
  sortOptions,
  periodOptions,
  languageOptions,
  onSelectGenre,
  onSelectSort,
  onSelectLanguage,
  onSelectPeriod,
  isPending,
  isError,
  items,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
  loadingMoreSlot,
  renderCard,
}: MediaArchivePageProps<TItem, TSort, TPeriod>) {
  const [openMenu, setOpenMenu] = useState<ArchiveMenuKey | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const [hasStaggeredInitialLoad, setHasStaggeredInitialLoad] = useState(false);

  // Latches one frame after the first non-empty result set has painted, so
  // that initial paint still renders with the stagger classes present; only
  // "load more"/filter-change renders after this effect fires get skipped.
  // Deferred via rAF (not set synchronously during render or in the effect
  // body) — setting it synchronously would flip the flag before the very
  // commit it's supposed to gate ever reaches the screen.
  useEffect(() => {
    if (hasStaggeredInitialLoad || items.length === 0) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setHasStaggeredInitialLoad(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [hasStaggeredInitialLoad, items.length]);

  useEffect(() => {
    if (!openMenu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!controlsRef.current?.contains(target)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);

  return (
    <main className="relative mx-auto w-full max-w-400">
      <div className="px-4 py-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="display-1 text-foreground">{heading}</h1>
          <p className="mono-meta text-muted-foreground">{`${archiveCountLabel} · logged, not filtered.`}</p>
        </div>

        {spotlight}

        <ArchiveFilterControls
          controlsRef={controlsRef}
          openMenu={openMenu}
          onBlurCapture={(event) => {
            if (!openMenu) {
              return;
            }

            const nextTarget = event.relatedTarget;
            if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
              setOpenMenu(null);
            }
          }}
          onToggleMenu={(menu) => {
            if (isPeriodDisabled && menu === "period") {
              return;
            }

            setOpenMenu((current) => (current === menu ? null : menu));
          }}
          onCloseMenu={() => setOpenMenu(null)}
          selectedGenre={selectedGenre}
          selectedLanguage={selectedLanguage}
          selectedSort={selectedSort}
          selectedPeriod={selectedPeriod}
          availableGenres={availableGenres}
          isPeriodDisabled={isPeriodDisabled}
          sortOptions={sortOptions}
          periodOptions={periodOptions}
          languageOptions={languageOptions}
          onSelectGenre={onSelectGenre}
          onSelectSort={onSelectSort}
          onSelectLanguage={onSelectLanguage}
          onSelectPeriod={onSelectPeriod}
          moduleStyles={moduleStyles}
        />

        {isPending ? <ArchiveSkeletonGrid moduleStyles={moduleStyles} /> : null}

        {isError ? (
          <div className="surface-card p-4 font-mono text-xs" style={{ color: moduleStyles.muted }}>
            {archiveErrorMessage}
          </div>
        ) : null}

        {!isPending && !isError && items.length === 0 ? (
          <div className="surface-card p-8 text-center font-mono text-xs" style={{ color: moduleStyles.muted }}>
            {emptyMessage}
          </div>
        ) : null}

        {!isPending && !isError && items.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 md:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {items.map((item, index) =>
                renderCard(
                  item,
                  index,
                  hasStaggeredInitialLoad ? undefined : "animate-fade-up",
                  hasStaggeredInitialLoad
                    ? undefined
                    : { animationDelay: `${Math.min(index * 40, 400)}ms` },
                ),
              )}
            </div>

            {hasNextPage ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  disabled={isFetchingNextPage}
                  className="theme-kicker border border-border/60 px-5 py-2 text-[10px] uppercase text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={onFetchNextPage}
                >
                  {isFetchingNextPage ? "Loading…" : "Show more"}
                </button>
              </div>
            ) : (
              <p className="mt-5 text-center font-mono text-[11px]" style={{ color: moduleStyles.faint }}>
                {endOfArchiveMessage}
              </p>
            )}

            {isFetchingNextPage ? loadingMoreSlot : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
