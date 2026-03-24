import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getBackdropUrl,
  getPosterUrl,
} from "@/features/films/components/utils";
import type { Movie } from "@/types/api";

type FilmDetailProps = {
  movie: Movie;
  actionSlot?: ReactNode;
};

const toRuntimeLabel = (runtime: number | null): string => {
  if (!runtime || runtime <= 0) {
    return "Runtime unknown";
  }

  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
};

export const FilmDetail = ({ movie, actionSlot }: FilmDetailProps) => {
  const genreList = Array.isArray(movie.genres) ? movie.genres : [];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70">
        <div className="relative h-56 w-full sm:h-72">
          <img
            src={getBackdropUrl(movie.backdropPath)}
            alt={`${movie.title} backdrop`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        <CardContent className="relative -mt-16 grid gap-6 px-5 pb-6 sm:grid-cols-[180px_1fr] sm:px-6">
          <img
            src={getPosterUrl(movie.posterPath)}
            alt={`${movie.title} poster`}
            className="w-[160px] rounded-lg border border-border shadow-xl sm:w-[180px]"
          />

          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold sm:text-3xl">{movie.title}</h1>
              {movie.originalTitle && movie.originalTitle !== movie.title ? (
                <p className="text-sm text-muted-foreground">{movie.originalTitle}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {movie.releaseYear ? <span>{movie.releaseYear}</span> : null}
              <span className="text-border">•</span>
              <span>{toRuntimeLabel(movie.runtime)}</span>
            </div>

            {genreList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {genreList.map((genre) => (
                  <Badge key={genre.id} variant="muted">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            ) : null}

            {movie.tagline ? (
              <p className="italic text-accent">“{movie.tagline}”</p>
            ) : null}

            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              {movie.overview || "No overview available for this title."}
            </p>

            {actionSlot ? <div className="pt-2">{actionSlot}</div> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
