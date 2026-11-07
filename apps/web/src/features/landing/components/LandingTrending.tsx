import { Link } from "@tanstack/react-router";
import { OutlinedRank } from "@/components/film/OutlinedRank";
import { LoadingRegion } from "@/components/ui/PageSkeletons";
import { Skeleton } from "@/components/ui/Skeleton";
import { toWeekLabel } from "@/features/media/archive/week-label";
import { getPosterUrl } from "@/features/movies/components/utils";
import type { TrendingMovie } from "@/features/feed/types";
import type { TrendingSeries } from "@/features/serials/api/types";

const pad = (index: number) => String(index + 1).padStart(2, "0");

// A still grid and a numbered list: each title once, nothing scrolls on its own.
type LandingTrendingProps = {
  films: TrendingMovie[];
  shows: TrendingSeries[];
  isLoadingFilms?: boolean;
  isLoadingShows?: boolean;
};

export const LandingTrending = ({ films, shows, isLoadingFilms = false, isLoadingShows = false }: LandingTrendingProps) => (
  <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_20rem]">
    <div>
      <div className="slate mono-meta mb-3 rounded-[3px] uppercase">
        <span>Trending on TMDB · Films</span>
        <span>{toWeekLabel(new Date())}</span>
      </div>
      {isLoadingFilms ? (
        <LoadingRegion label="Loading trending films" className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index}>
              <Skeleton shape="poster" className="rounded-[2px]" />
              <Skeleton className="mt-1.5 h-2.5 w-3/4 rounded-sm" />
            </div>
          ))}
        </LoadingRegion>
      ) : (
        <ul aria-label="Trending films" className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {films.slice(0, 8).map((film, index) => (
            <li key={film.tmdbId}>
              <Link to="/movies/$tmdbId" params={{ tmdbId: String(film.tmdbId) }} className="group block">
                <span className="relative block aspect-[2/3] overflow-hidden rounded-[2px] bg-foreground/10">
                  {film.posterPath ? <img src={getPosterUrl(film.posterPath)} alt="" className="h-full w-full object-cover" /> : null}
                  <OutlinedRank value={index + 1} className="absolute top-0 left-1" />
                </span>
                <span className="caption mt-1 block truncate text-foreground group-hover:text-primary">{film.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
    <div>
      <div className="slate mono-meta mb-3 rounded-[3px] uppercase">
        <span>Trending · TV</span>
        <span />
      </div>
      {isLoadingShows ? (
        <LoadingRegion label="Loading trending TV">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 border-b border-[color:var(--line)] py-2.5">
              <Skeleton className="h-2.5 w-4 rounded-sm" />
              <Skeleton className="h-3 rounded-sm" style={{ width: `${45 + ((index * 17) % 35)}%` }} />
            </div>
          ))}
        </LoadingRegion>
      ) : (
        <ol aria-label="Trending TV">
          {shows.slice(0, 8).map((show, index) => (
            <li key={show.tmdbId} className="border-b border-[color:var(--line)]">
              <Link to="/serials/$tmdbId" params={{ tmdbId: String(show.tmdbId) }} className="flex items-baseline gap-3 py-2 hover:text-primary">
                <span className="mono-meta text-muted-foreground">{pad(index)}</span>
                <span className="body-s min-w-0 flex-1 truncate text-foreground">{show.title}</span>
                {show.firstAirYear ? <span className="mono-meta text-muted-foreground">{show.firstAirYear}</span> : null}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  </section>
);
