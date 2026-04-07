import type { TmdbSearchMovie } from "@/types/api";
import { getPosterUrl } from "@/features/films/components/utils";
import { getReleaseYear } from "@/features/films/components/cinema-search-dialog/utils";
import { cn } from "@/lib/utils";

type CinemaSearchMovieResultItemProps = {
  inputId: string;
  index: number;
  movie: TmdbSearchMovie;
  isHighlighted: boolean;
  onHover: (index: number) => void;
  onSelect: (tmdbId: number) => void;
};

export const CinemaSearchMovieResultItem = ({
  inputId,
  index,
  movie,
  isHighlighted,
  onHover,
  onSelect,
}: CinemaSearchMovieResultItemProps) => {
  const year = getReleaseYear(movie.release_date);

  return (
    <li>
      <button
        id={`${inputId}-result-${index}`}
        type="button"
        role="option"
        aria-selected={isHighlighted}
        className={cn(
          "grid w-full grid-cols-[42px_1fr] gap-2 border px-2 py-2 text-left transition-colors",
          isHighlighted
            ? "border-primary/45 bg-primary/12"
            : "border-border/75 bg-background/30 hover:bg-secondary/40",
        )}
        onMouseEnter={() => onHover(index)}
        onClick={() => onSelect(movie.id)}
      >
        <img
          src={getPosterUrl(movie.poster_path)}
          alt={`${movie.title} poster`}
          className="h-14 w-10 object-cover"
          loading="lazy"
        />

        <span className="space-y-0.5">
          <span className="line-clamp-1 block text-sm font-semibold text-foreground">
            {movie.title}
          </span>
          <span className="block text-xs text-muted-foreground">{year ?? "Unknown year"}</span>
        </span>
      </button>
    </li>
  );
};
