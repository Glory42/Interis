import { Link } from "@tanstack/react-router";
import { Award } from "lucide-react";
import type { ArchiveMovie } from "@/features/films/api";
import { getPosterUrl } from "@/features/films/components/utils";
import { CINEMA_MODULE_STYLES } from "@/features/films/components/cinema-archive/constants";
import {
  getMovieStateLabel,
  getReleaseYearLabel,
} from "@/features/films/components/cinema-archive/utils";

type ArchiveMovieCardProps = {
  movie: ArchiveMovie;
};

export const ArchiveMovieCard = ({ movie }: ArchiveMovieCardProps) => {
  const stateLabel = getMovieStateLabel(movie);

  return (
    <Link
      to="/cinema/$tmdbId"
      params={{ tmdbId: String(movie.tmdbId) }}
      className="block w-full text-left"
      viewTransition
    >
      <div
        className="relative mb-3 aspect-2/3 overflow-hidden border transition-colors"
        style={{
          borderColor: CINEMA_MODULE_STYLES.border,
          background: CINEMA_MODULE_STYLES.panel,
        }}
      >
        {movie.posterPath ? (
          <img
            src={getPosterUrl(movie.posterPath)}
            alt={`${movie.title} poster`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2"
            style={{ background: CINEMA_MODULE_STYLES.panelSoft }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center"
              style={{ background: CINEMA_MODULE_STYLES.panelStrong }}
            >
              <Award className="h-4 w-4" style={{ color: CINEMA_MODULE_STYLES.accent }} />
            </div>
            <span
              className="font-mono text-[8px] uppercase tracking-[0.22em]"
              style={{ color: CINEMA_MODULE_STYLES.faint }}
            >
              No Art
            </span>
          </div>
        )}

        {stateLabel ? (
          <div className="absolute right-2 top-2">
            <span
              className="border px-2 py-0.5 font-mono text-[9px] tracking-[0.16em]"
              style={{
                borderColor: CINEMA_MODULE_STYLES.accent,
                color: CINEMA_MODULE_STYLES.accent,
                background: CINEMA_MODULE_STYLES.badge,
              }}
            >
              {stateLabel}
            </span>
          </div>
        ) : null}
      </div>

      <p
        className="truncate font-mono text-[11px] leading-tight"
        style={{ color: CINEMA_MODULE_STYLES.text }}
      >
        {movie.title}
      </p>
      <p
        className="truncate font-mono text-[10px]"
        style={{ color: CINEMA_MODULE_STYLES.muted }}
      >
        <span>{movie.director ?? "Unknown director"}</span>
        <span style={{ color: CINEMA_MODULE_STYLES.faint }}>
          {" "}· {getReleaseYearLabel(movie)}
        </span>
      </p>
    </Link>
  );
};
