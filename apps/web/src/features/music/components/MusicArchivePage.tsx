import { useEffect, useMemo, useRef, useState } from "react";
import { Music } from "lucide-react";
import { ARCHIVE_PAGE_SIZE, MUSIC_MODULE_STYLES, sortOptions, typeOptions } from "@/features/music/components/music-archive/constants";
import { MusicArchiveControls } from "@/features/music/components/music-archive/MusicArchiveControls";
import type { MusicArchiveSort } from "@/features/music/api";
import { useMusicArchive } from "@/features/music/hooks/useMusic";
import { ArchiveMediaCard } from "@/features/media-archive/components/ArchiveMediaCard";
import { ArchiveSkeletonGrid } from "@/features/media-archive/components/ArchiveSkeletonGrid";
import type { ArchiveMenuKey } from "@/features/media-archive/types";

function formatArchiveCount(count: number): string {
  if (count === 0) return "No albums";
  if (count === 1) return "1 album";
  return `${count.toLocaleString()} albums`;
}

export const MusicArchivePage = () => {
  const [selectedSort, setSelectedSort] = useState<MusicArchiveSort>("logs_desc");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [openMenu, setOpenMenu] = useState<ArchiveMenuKey | null>(null);

  const controlsRef = useRef<HTMLDivElement | null>(null);

  const selectedSortLabel = useMemo(
    () => sortOptions.find((o) => o.value === selectedSort)?.label ?? "Most listened",
    [selectedSort],
  );

  const selectedTypeLabel = useMemo(
    () => typeOptions.find((o) => o.value === selectedType)?.label ?? "All types",
    [selectedType],
  );

  const archiveQuery = useMusicArchive(
    selectedGenre === "all" ? "" : selectedGenre,
    selectedType === "all" ? "" : selectedType,
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
            style={{ color: MUSIC_MODULE_STYLES.accent }}
          >
            Module 04
          </p>
          <h2
            className="mb-2 font-mono text-3xl font-bold md:text-5xl"
            style={{ color: MUSIC_MODULE_STYLES.text }}
          >
            Music
          </h2>
          <p className="font-mono text-sm" style={{ color: MUSIC_MODULE_STYLES.muted }}>
            albums - singles - EPs - releases
          </p>
        </div>

        <MusicArchiveControls
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
          selectedType={selectedType}
          selectedSort={selectedSort}
          selectedSortLabel={selectedSortLabel}
          selectedTypeLabel={selectedTypeLabel}
          availableGenres={firstPage?.availableGenres}
          archiveCountLabel={archiveCountLabel}
          onSelectGenre={setSelectedGenre}
          onSelectSort={setSelectedSort}
          onSelectType={setSelectedType}
        />

        {archiveQuery.isPending ? (
          <ArchiveSkeletonGrid moduleStyles={MUSIC_MODULE_STYLES} aspectClassName="aspect-square" />
        ) : null}

        {archiveQuery.isError ? (
          <div
            className="border p-4 font-mono text-xs"
            style={{
              borderColor: MUSIC_MODULE_STYLES.border,
              color: MUSIC_MODULE_STYLES.muted,
              background: MUSIC_MODULE_STYLES.panel,
            }}
          >
            Could not load the music archive right now.
          </div>
        ) : null}

        {!archiveQuery.isPending && !archiveQuery.isError && archiveItems.length === 0 ? (
          <div
            className="border p-8 text-center font-mono text-xs"
            style={{
              borderColor: MUSIC_MODULE_STYLES.border,
              color: MUSIC_MODULE_STYLES.muted,
              background: MUSIC_MODULE_STYLES.panel,
            }}
          >
            No albums match these filters right now.
          </div>
        ) : null}

        {!archiveQuery.isPending && !archiveQuery.isError && archiveItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 md:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {archiveItems.map((album) => (
                <ArchiveMediaCard
                  key={`music-archive-item-${album.mbid}`}
                  kind="album"
                  id={album.mbid}
                  title={album.title}
                  imageUrl={album.coverArtUrl}
                  fallbackIcon={Music}
                  fallbackLabel="No Art"
                  aspectClassName="aspect-square"
                  stateLabel={
                    album.viewerHasLogged ? "Listened" : album.viewerWantToListen ? "Queue" : null
                  }
                  rating={album.avgRating}
                  ratingSource="user"
                  subtitlePrimary={album.artistName}
                  subtitleSecondary={album.firstReleaseYear ? String(album.firstReleaseYear) : null}
                  moduleStyles={MUSIC_MODULE_STYLES}
                />
              ))}
            </div>

            {hasNextPage ? (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  disabled={isFetchingNextPage}
                  className="border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: MUSIC_MODULE_STYLES.border,
                    color: MUSIC_MODULE_STYLES.muted,
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
                style={{ color: MUSIC_MODULE_STYLES.faint }}
              >
                End of music archive.
              </p>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
};
