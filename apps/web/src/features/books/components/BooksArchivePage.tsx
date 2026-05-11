import { useEffect, useMemo, useRef, useState } from "react";
import { ARCHIVE_PAGE_SIZE, BOOK_MODULE_STYLES, languageOptions, sortOptions } from "@/features/books/components/books-archive/constants";
import { ArchiveSkeletonGrid } from "@/features/books/components/books-archive/ArchiveSkeletonGrid";
import { GridBookCard } from "@/features/books/components/books-archive/GridBookCard";
import { BooksArchiveControls } from "@/features/books/components/books-archive/BooksArchiveControls";
import type { OpenMenu } from "@/features/books/components/books-archive/types";
import type { BooksArchiveSort } from "@/features/books/api";
import { useBooksArchive } from "@/features/books/hooks/useBooks";

function formatArchiveCount(count: number): string {
  if (count === 0) return "No books";
  if (count === 1) return "1 book";
  return `${count.toLocaleString()} books`;
}

export const BooksArchivePage = () => {
  const [selectedSort, setSelectedSort] = useState<BooksArchiveSort>("logs_desc");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  const controlsRef = useRef<HTMLDivElement | null>(null);

  const selectedSortLabel = useMemo(
    () => sortOptions.find((o) => o.value === selectedSort)?.label ?? "Most read",
    [selectedSort],
  );

  const selectedLanguageLabel = useMemo(
    () => languageOptions.find((o) => o.value === selectedLanguage)?.label ?? "All languages",
    [selectedLanguage],
  );

  const archiveQuery = useBooksArchive(
    selectedGenre === "all" ? "" : selectedGenre,
    selectedLanguage === "all" ? "" : selectedLanguage,
    selectedSort,
    ARCHIVE_PAGE_SIZE,
  );

  const archivePages = archiveQuery.data?.pages;
  const firstPage = archivePages?.[0] ?? null;
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = archiveQuery;

  const archiveItems = useMemo(
    () => (archivePages ? archivePages.flatMap((page) => page.items) : []),
    [archivePages],
  );

  const archiveCount = firstPage?.filteredCount ?? archiveItems.length;
  const archiveCountLabel = formatArchiveCount(archiveCount);

  useEffect(() => {
    if (!openMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!controlsRef.current?.contains(target)) setOpenMenu(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
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
      <div className="px-4 py-8">
        <div className="mb-8">
          <p
            className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{ color: BOOK_MODULE_STYLES.accent }}
          >
            Module 05
          </p>
          <h2
            className="mb-2 font-mono text-3xl font-bold md:text-5xl"
            style={{ color: BOOK_MODULE_STYLES.text }}
          >
            Books
          </h2>
          <p className="font-mono text-sm" style={{ color: BOOK_MODULE_STYLES.muted }}>
            novels - non-fiction - essays - graphic novels
          </p>
        </div>

        <BooksArchiveControls
          controlsRef={controlsRef}
          openMenu={openMenu}
          onBlurCapture={(event) => {
            if (!openMenu) return;
            const nextTarget = event.relatedTarget;
            if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
              setOpenMenu(null);
            }
          }}
          onToggleMenu={(menu) => setOpenMenu((current) => (current === menu ? null : menu))}
          onCloseMenu={() => setOpenMenu(null)}
          selectedGenre={selectedGenre}
          selectedLanguage={selectedLanguage}
          selectedSort={selectedSort}
          selectedSortLabel={selectedSortLabel}
          selectedLanguageLabel={selectedLanguageLabel}
          availableGenres={firstPage?.availableGenres}
          archiveCountLabel={archiveCountLabel}
          onSelectGenre={setSelectedGenre}
          onSelectSort={setSelectedSort}
          onSelectLanguage={setSelectedLanguage}
        />

        {archiveQuery.isPending ? <ArchiveSkeletonGrid /> : null}

        {archiveQuery.isError ? (
          <div
            className="border p-4 font-mono text-xs"
            style={{
              borderColor: BOOK_MODULE_STYLES.border,
              color: BOOK_MODULE_STYLES.muted,
              background: BOOK_MODULE_STYLES.panel,
            }}
          >
            Could not load the book archive right now.
          </div>
        ) : null}

        {!archiveQuery.isPending && !archiveQuery.isError && archiveItems.length === 0 ? (
          <div
            className="border p-8 text-center font-mono text-xs"
            style={{
              borderColor: BOOK_MODULE_STYLES.border,
              color: BOOK_MODULE_STYLES.muted,
              background: BOOK_MODULE_STYLES.panel,
            }}
          >
            No books match these filters right now.
          </div>
        ) : null}

        {!archiveQuery.isPending && !archiveQuery.isError && archiveItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 md:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {archiveItems.map((book) => (
                <GridBookCard key={`books-archive-item-${book.googleVolumeId}`} book={book} />
              ))}
            </div>

            {hasNextPage ? (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  disabled={isFetchingNextPage}
                  className="border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: BOOK_MODULE_STYLES.border,
                    color: BOOK_MODULE_STYLES.muted,
                    background: "transparent",
                  }}
                  onClick={() => { void fetchNextPage(); }}
                >
                  {isFetchingNextPage ? "Loading..." : "Show more"}
                </button>
              </div>
            ) : (
              <p
                className="mt-5 text-center font-mono text-[11px]"
                style={{ color: BOOK_MODULE_STYLES.faint }}
              >
                End of book archive.
              </p>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
};
