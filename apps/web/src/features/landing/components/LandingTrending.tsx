import { Link } from "@tanstack/react-router";
import { OutlinedRank } from "@/components/film/OutlinedRank";
import { toWeekLabel } from "@/features/media/archive/week-label";
import { getPosterUrl } from "@/features/movies/components/utils";
import type { TrendingMovie } from "@/features/feed/types";
import type { TrendingSeries } from "@/features/serials/api/types";

const pad = (index: number) => String(index + 1).padStart(2, "0");

// A still grid and a numbered list: each title once, nothing scrolls on its own.
export const LandingTrending = ({ films, shows }: { films: TrendingMovie[]; shows: TrendingSeries[] }) => (
  <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_20rem]">
    <div>
      <div className="slate mono-meta mb-3 rounded-[3px] uppercase">
        <span>Trending on TMDB · Films</span>
        <span>{toWeekLabel(new Date())}</span>
      </div>
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
    </div>
    <div>
      <div className="slate mono-meta mb-3 rounded-[3px] uppercase">
        <span>Trending · TV</span>
        <span />
      </div>
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
    </div>
  </section>
);
