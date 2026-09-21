import { useMemo } from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { PosterWallBackdrop } from "@/components/layout/PosterWallBackdrop";
import { TrendingPosterRow } from "@/components/media/TrendingPosterRow";
import { useTrendingNow } from "@/features/feed/hooks/useFeed";
import { useTrendingSeries } from "@/features/serials/hooks/useSerials";
import { buildPosterWall } from "@/lib/poster-wall";

const POSTER_WALL_SIZE = 24;

// Pathless layout route (the leading "_" contributes no URL segment) shared
// by /login, /register, and /forgot-password — see routes/_authLayout/*.
// Keeping the trending rows mounted here (instead of inside each page) means
// they survive navigation between those three routes instead of remounting.
export const Route = createFileRoute("/_authLayout")({
  component: AuthLayoutRoute,
});

function AuthLayoutRoute() {
  const trendingMoviesQuery = useTrendingNow(9);
  const trendingSeriesQuery = useTrendingSeries();
  const trendingMoviesData = trendingMoviesQuery.data;
  const trendingSeriesData = trendingSeriesQuery.data;
  const trendingMovies = trendingMoviesData ?? [];
  const trendingSeries = trendingSeriesData ?? [];

  const posterWall = useMemo(
    () =>
      buildPosterWall(
        [
          ...(trendingMoviesData ?? []).map((movie) => movie.posterPath),
          ...(trendingSeriesData ?? []).map((series) => series.posterPath),
        ],
        POSTER_WALL_SIZE,
      ),
    [trendingMoviesData, trendingSeriesData],
  );

  return (
    <div className="relative overflow-hidden">
      <PosterWallBackdrop posterPaths={posterWall} />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-7xl flex-col justify-center px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-[28rem_1fr] lg:items-center">
          <div className="w-full max-w-md">
            <Outlet />
          </div>

          <div className="hidden min-w-0 space-y-8 lg:block">
            <TrendingPosterRow
              title="Trending Movies"
              to="/movies/$tmdbId"
              accentColor="var(--module-movie)"
              isLoading={trendingMoviesQuery.isPending}
              isError={trendingMoviesQuery.isError}
              items={trendingMovies.map((movie) => ({
                id: `movie-${movie.tmdbId}`,
                title: movie.title,
                tmdbId: movie.tmdbId,
                posterPath: movie.posterPath,
              }))}
            />

            <TrendingPosterRow
              title="Trending Shows"
              to="/serials/$tmdbId"
              accentColor="var(--module-serial)"
              isLoading={trendingSeriesQuery.isPending}
              isError={trendingSeriesQuery.isError}
              items={trendingSeries.map((series) => ({
                id: `serial-${series.tmdbId}`,
                title: series.title,
                tmdbId: series.tmdbId,
                posterPath: series.posterPath,
              }))}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
