import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatRuntimeLabel,
  getBackdropUrl,
  getPosterUrl,
} from "@/features/films/components/utils";
import type { Movie } from "@/types/api";

type FilmDetailProps = {
  movie: Movie;
  actionSlot?: ReactNode;
};

export const FilmDetail = ({ movie, actionSlot }: FilmDetailProps) => {
  const genreList = Array.isArray(movie.genres) ? movie.genres : [];
  const runtimeLabel = formatRuntimeLabel(movie.runtime) ?? "Runtime unknown";

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70">
        <div className="relative h-44 w-full sm:h-64 lg:h-72">
          <img
            src={getBackdropUrl(movie.backdropPath)}
            alt={`${movie.title} backdrop`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent" />
        </div>

        <CardContent className="relative -mt-10 grid gap-4 px-3 pb-5 sm:-mt-14 sm:grid-cols-[150px_1fr] sm:gap-5 sm:px-5 sm:pb-6 lg:grid-cols-[180px_1fr] lg:gap-6 lg:px-6">
          <img
            src={getPosterUrl(movie.posterPath)}
            alt={`${movie.title} poster`}
            className="w-33 rounded-lg border border-border shadow-xl sm:w-37.5 lg:w-45"
          />

          <div className="min-w-0 space-y-3.5 sm:space-y-4">
            <div className="space-y-1">
              <h1 className="wrap-break-word text-[clamp(1.35rem,5vw,1.95rem)] font-bold">
                {movie.title}
              </h1>
              {movie.originalTitle && movie.originalTitle !== movie.title ? (
                <p className="wrap-break-word text-sm text-muted-foreground">
                  {movie.originalTitle}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {movie.releaseYear ? <span>{movie.releaseYear}</span> : null}
              <span className="text-border">•</span>
              <span>{runtimeLabel}</span>
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

            <p className="max-w-3xl text-sm leading-7 text-muted-foreground wrap-break-word">
              {movie.overview || "No overview available for this title."}
            </p>

            {actionSlot ? <div className="pt-2">{actionSlot}</div> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
