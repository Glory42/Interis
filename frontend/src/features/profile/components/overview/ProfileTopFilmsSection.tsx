import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { getPosterUrl } from "@/features/films/components/utils";
import type { UserTopMovie } from "@/features/profile/api";
import { cn } from "@/lib/utils";

type MovieRatingMap = Map<
  number,
  {
    ratingOutOfFive: number;
    roundedStars: number;
  }
>;

type ProfileTopFilmsSectionProps = {
  movies: UserTopMovie[];
  ratingByTmdbId: MovieRatingMap;
};

const PlaceholderTopFilmCard = ({ slotNumber }: { slotNumber: number }) => (
  <div>
    <div className="relative mb-1.5 aspect-2/3 overflow-hidden  border border-dashed border-border/70 bg-card/25">
      <div className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
        Empty slot {slotNumber}
      </div>
    </div>
    <p className="truncate text-[11px] font-semibold text-foreground/95">
      No film selected
    </p>
    <p className="text-[10px] text-muted-foreground/85">Add from settings</p>
  </div>
);

export const ProfileTopFilmsSection = ({
  movies,
  ratingByTmdbId,
}: ProfileTopFilmsSectionProps) => {
  const slots: Array<UserTopMovie | null> = [
    movies[0] ?? null,
    movies[1] ?? null,
    movies[2] ?? null,
    movies[3] ?? null,
  ];

  return (
    <div>
      <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        Top Films
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {slots.map((movie, index) => {
          if (!movie) {
            return (
              <PlaceholderTopFilmCard
                key={`top-film-slot-${index + 1}`}
                slotNumber={index + 1}
              />
            );
          }

          const rating = ratingByTmdbId.get(movie.tmdbId) ?? null;

          return (
            <Link
              key={`top-film-${movie.tmdbId}`}
              to="/cinema/$tmdbId"
              params={{ tmdbId: String(movie.tmdbId) }}
              className="group block cursor-pointer"
              viewTransition
            >
              <div className="relative mb-1.5 aspect-2/3 overflow-hidden  bg-card/80">
                <img
                  alt={movie.title}
                  className="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                  src={getPosterUrl(movie.posterPath)}
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-linear-to-t from-background/90 via-background/10 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100" />

                <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-2.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {rating ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <Star
                            key={`top-film-star-${movie.tmdbId}-${starIndex}`}
                            className={cn(
                              "h-2.5 w-2.5",
                              starIndex < rating.roundedStars
                                ? "fill-primary text-primary"
                                : "text-muted-foreground/70",
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-foreground/90">
                        {rating.ratingOutOfFive.toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">
                      No rating yet
                    </p>
                  )}
                </div>
              </div>

              <p className="truncate text-[11px] font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                {movie.title}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/85">
                {movie.director ?? "Unknown director"}
                {movie.releaseYear ? ` · ${movie.releaseYear}` : ""}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
