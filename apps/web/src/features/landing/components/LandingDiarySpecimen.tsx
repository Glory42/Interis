import { RocketDisplay } from "@/components/film/rating/RocketDisplay";
import { toWeekLabel } from "@/features/media/archive/week-label";
import { getPosterUrl } from "@/features/movies/components/utils";
import type { TrendingMovie } from "@/features/feed/types";

const EXAMPLE = [
  { day: "Fri 06", rating: 9 },
  { day: "Wed 04", rating: 7 },
  { day: "Mon 02", rating: 8 },
];

// An example of what a diary week looks like, built from this week's trending posters.
export const LandingDiarySpecimen = ({ films }: { films: TrendingMovie[] }) => (
  <div className="overflow-hidden rounded-[3px] border border-[color:var(--line)]">
    <div className="slate mono-meta uppercase">
      <span>Your diary · Example</span>
      <span>{toWeekLabel(new Date()).split(" · ")[0]}</span>
    </div>
    <ol>
      {EXAMPLE.map((row, index) => {
        const film = films[index];
        return (
          <li key={row.day} className="flex items-center gap-3 border-b border-[color:var(--line)] px-3 py-2.5 last:border-0">
            <span className="mono-meta w-12 shrink-0 uppercase text-muted-foreground">{row.day}</span>
            <span className="aspect-[2/3] w-8 shrink-0 overflow-hidden rounded-[2px] bg-foreground/10">
              {film?.posterPath ? <img src={getPosterUrl(film.posterPath)} alt="" className="h-full w-full object-cover" /> : null}
            </span>
            <span className="body-s min-w-0 flex-1 truncate text-foreground">
              {film ? `${film.title}${film.releaseYear ? ` · ${film.releaseYear}` : ""}` : "A film you watched"}
            </span>
            <RocketDisplay rating={row.rating} variant="compact" size="sm" />
          </li>
        );
      })}
    </ol>
  </div>
);
