import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getPosterUrl } from "@/features/films/components/utils";
import { useTrendingNow } from "@/features/feed/hooks/useFeed";
import { useTrendingSeries } from "@/features/serials/hooks/useSerials";

const PAGE_SIZE = 3;
const ROTATE_INTERVAL_MS = 5000;

type Tile = {
  id: string;
  title: string;
  to: "/cinema/$tmdbId" | "/serials/$tmdbId";
  tmdbId: number;
  posterPath: string | null;
};

const chunk = <T,>(items: T[], size: number): T[][] => {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages.length > 0 ? pages : [[]];
};

const PosterTile = ({ tile }: { tile: Tile }) => (
  <Link to={tile.to} params={{ tmdbId: String(tile.tmdbId) }} className="group block" viewTransition>
    <div className="aspect-2/3 w-full overflow-hidden rounded-lg bg-muted/30">
      {tile.posterPath ? (
        <img
          src={getPosterUrl(tile.posterPath)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : null}
    </div>
    <p className="mt-1.5 truncate text-xs text-foreground/80 transition-colors group-hover:text-foreground">
      {tile.title}
    </p>
  </Link>
);

// Ticks its own page forward on its own timer — a `initialDelayMs` offset
// (rather than sharing one interval/state between rows) is what keeps the
// Cinema and Serial rows from sliding in lockstep.
const useAutoRotatePage = (pageCount: number, initialDelayMs: number): number => {
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (pageCount <= 1) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      setPage((current) => (current + 1) % pageCount);
      intervalId = window.setInterval(() => {
        setPage((current) => (current + 1) % pageCount);
      }, ROTATE_INTERVAL_MS);
    }, initialDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [pageCount, initialDelayMs]);

  return page % Math.max(pageCount, 1);
};

// Renders every page's tiles up front, side by side, and slides the track
// with a transform — the images stay mounted across rotations instead of
// unmounting/reloading each tick (which was flashing empty tiles).
const SlidingRow = ({ pages, activePage }: { pages: Tile[][]; activePage: number }) => (
  <div className="overflow-hidden">
    <div
      className="flex transition-transform duration-700 ease-out"
      style={{ transform: `translateX(-${activePage * 100}%)` }}
    >
      {pages.map((pageTiles, index) => (
        <div key={index} className="grid w-full shrink-0 grid-cols-3 gap-3">
          {pageTiles.map((tile) => (
            <PosterTile key={tile.id} tile={tile} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const AuthTrendingCarousel = () => {
  const moviesQuery = useTrendingNow(9);
  const seriesQuery = useTrendingSeries();

  const movieTiles: Tile[] = useMemo(
    () =>
      (moviesQuery.data ?? []).map((movie) => ({
        id: `cinema-${movie.tmdbId}`,
        title: movie.title,
        to: "/cinema/$tmdbId" as const,
        tmdbId: movie.tmdbId,
        posterPath: movie.posterPath,
      })),
    [moviesQuery.data],
  );
  const seriesTiles: Tile[] = useMemo(
    () =>
      (seriesQuery.data ?? []).map((series) => ({
        id: `serial-${series.tmdbId}`,
        title: series.title,
        to: "/serials/$tmdbId" as const,
        tmdbId: series.tmdbId,
        posterPath: series.posterPath,
      })),
    [seriesQuery.data],
  );

  const moviePages = useMemo(() => chunk(movieTiles, PAGE_SIZE), [movieTiles]);
  const seriesPages = useMemo(() => chunk(seriesTiles, PAGE_SIZE), [seriesTiles]);

  // Serial starts its first tick half an interval after Cinema, then both
  // repeat every ROTATE_INTERVAL_MS — so they alternate (5s, 10s, 15s… vs
  // 2.5s, 7.5s, 12.5s…) instead of always flipping on the same beat.
  const movieActivePage = useAutoRotatePage(moviePages.length, ROTATE_INTERVAL_MS);
  const seriesActivePage = useAutoRotatePage(seriesPages.length, ROTATE_INTERVAL_MS / 2);

  if (movieTiles.length === 0 && seriesTiles.length === 0) {
    return null;
  }

  return (
    <div>
      {movieTiles.length > 0 ? (
        <>
          <p className="theme-kicker mb-2 text-[8px] text-(--module-cinema)">Cinema</p>
          <SlidingRow pages={moviePages} activePage={movieActivePage} />
        </>
      ) : null}

      {seriesTiles.length > 0 ? (
        <>
          <p className="theme-kicker mt-4 mb-2 text-[8px] text-(--module-serial)">Serial</p>
          <SlidingRow pages={seriesPages} activePage={seriesActivePage} />
        </>
      ) : null}
    </div>
  );
};
