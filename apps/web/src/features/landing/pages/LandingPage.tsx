import { useMemo } from "react";
import { TrendingPosterRow } from "@/components/media/TrendingPosterRow";
import { useTrendingNow } from "@/features/feed/hooks/useFeed";
import { LandingHero } from "@/features/landing/components/LandingHero";
import { useTrendingSeries } from "@/features/serials/hooks/useSerials";
import { buildPosterWall } from "@/lib/poster-wall";

const POSTER_WALL_SIZE = 24;

export const LandingPage = () => {
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
    <div className="w-full">
      <LandingHero posterPaths={posterWall} />

      <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-10">
        <TrendingPosterRow
          title="Trending Movies"
          to="/cinema/$tmdbId"
          accentColor="var(--module-cinema)"
          isLoading={trendingMoviesQuery.isPending}
          isError={trendingMoviesQuery.isError}
          items={trendingMovies.map((movie) => ({
            id: `cinema-${movie.tmdbId}`,
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
  );
};
