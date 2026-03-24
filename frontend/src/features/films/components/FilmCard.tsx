import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPosterUrl, toReleaseYear } from "@/features/films/components/utils";
import type { TmdbSearchMovie } from "@/types/api";

type FilmCardProps = {
  movie: TmdbSearchMovie;
};

export const FilmCard = ({ movie }: FilmCardProps) => {
  const releaseYear = toReleaseYear(movie.release_date);

  return (
    <Card className="overflow-hidden border-border/70">
      <CardContent className="p-0">
        <Link
          to="/films/$tmdbId"
          params={{ tmdbId: String(movie.id) }}
          viewTransition
          startTransition
          className="group grid gap-3 p-3 sm:grid-cols-[88px_1fr] sm:gap-4 sm:p-4"
        >
          <img
            src={getPosterUrl(movie.poster_path)}
            alt={`${movie.title} poster`}
            className="h-28 w-[76px] rounded-md border border-border/80 object-cover transition-transform duration-300 group-hover:scale-[1.03] sm:h-32 sm:w-[88px]"
            loading="lazy"
          />

          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">{movie.title}</h3>
              {releaseYear ? <Badge variant="accent">{releaseYear}</Badge> : null}
            </div>
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {movie.overview || "No synopsis available for this movie yet."}
            </p>
            <span className="inline-flex text-xs font-medium text-primary">
              Open details
            </span>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};
