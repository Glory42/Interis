import { Link } from "@tanstack/react-router";
import { Award, Check, Plus } from "lucide-react";
import { LogFilmModal } from "@/features/diary/components/LogFilmModal";
import type { MovieDetailResponse } from "@/features/films/api";
import { SpaceRatingInput } from "@/features/films/components/SpaceRating";
import { formatRatingOutOfFiveLabel } from "@/features/films/components/spaceRating.utils";
import { CINEMA_MODULE_STYLES } from "@/features/films/components/cinema-detail/styles";
import { getPosterUrl } from "@/features/films/components/utils";

type CinemaActionsSidebarProps = {
  detail: MovieDetailResponse;
  draftRatingOutOfFive: number | null;
  onDraftRatingChange: (ratingOutOfFive: number | null) => void;
  isAuthenticated: boolean;
  watchlisted: boolean;
  isInteractionBusy: boolean;
  onToggleWatchlist: () => void;
};

export const CinemaActionsSidebar = ({
  detail,
  draftRatingOutOfFive,
  onDraftRatingChange,
  isAuthenticated,
  watchlisted,
  isInteractionBusy,
  onToggleWatchlist,
}: CinemaActionsSidebarProps) => {
  const movie = detail.movie;

  const modalInitialState = {
    watchedDate: detail.userRating?.watchedDate ?? null,
    ratingOutOfFive:
      draftRatingOutOfFive ??
      (detail.userRating?.ratingOutOfFive !== null &&
      detail.userRating?.ratingOutOfFive !== undefined
        ? detail.userRating.ratingOutOfFive
        : null),
    rewatch: detail.userRating?.rewatch ?? false,
    reviewContent: detail.userRating?.reviewContent ?? null,
    containsSpoilers: detail.userRating?.reviewContainsSpoilers ?? null,
  };

  const resolvedUserRatingLabel =
    formatRatingOutOfFiveLabel(draftRatingOutOfFive) ??
    formatRatingOutOfFiveLabel(detail.userRating?.ratingOutOfFive ?? null) ??
    "No rating yet";

  return (
    <aside>
      <div
        className="mb-4 aspect-2/3 overflow-hidden border"
        style={{ borderColor: CINEMA_MODULE_STYLES.border }}
      >
        {movie.posterPath ? (
          <img
            src={getPosterUrl(movie.posterPath)}
            alt={`${movie.title} poster`}
            className="h-full w-full object-cover"
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
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <LogFilmModal
            tmdbId={movie.tmdbId}
            movieTitle={movie.title}
            movieReleaseYear={movie.releaseYear}
            moviePosterPath={movie.posterPath}
            initialState={modalInitialState}
            triggerVariant="outline"
            triggerLabel="Log"
            triggerClassName="h-auto flex-1 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
            triggerContent={
              <>
                <Check className="h-3 w-3" />
                <span>Log</span>
              </>
            }
          />

          {isAuthenticated ? (
            <button
              type="button"
              disabled={isInteractionBusy}
              className="flex flex-1 items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: watchlisted
                  ? CINEMA_MODULE_STYLES.accent
                  : CINEMA_MODULE_STYLES.border,
                color: watchlisted
                  ? CINEMA_MODULE_STYLES.accent
                  : CINEMA_MODULE_STYLES.muted,
                background: "transparent",
              }}
              onClick={onToggleWatchlist}
            >
              <Plus className="h-3 w-3" />
              <span>{watchlisted ? "Queued" : "Queue"}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex flex-1 items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{
                borderColor: CINEMA_MODULE_STYLES.border,
                color: CINEMA_MODULE_STYLES.muted,
              }}
              viewTransition
            >
              <Plus className="h-3 w-3" />
              <span>Queue</span>
            </Link>
          )}
        </div>

        <div
          className="border p-3"
          style={{
            borderColor: CINEMA_MODULE_STYLES.border,
            background: CINEMA_MODULE_STYLES.panelElevated,
          }}
        >
          <p
            className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: CINEMA_MODULE_STYLES.faint }}
          >
            Your Rating
          </p>
          <div className="flex items-center gap-3">
            <SpaceRatingInput
              value={
                draftRatingOutOfFive ??
                (detail.userRating?.ratingOutOfFive !== null &&
                detail.userRating?.ratingOutOfFive !== undefined
                  ? detail.userRating.ratingOutOfFive
                  : null)
              }
              onChange={onDraftRatingChange}
            />
          </div>
          <p
            className="mt-2 font-mono text-[10px]"
            style={{ color: CINEMA_MODULE_STYLES.muted }}
          >
            {resolvedUserRatingLabel}
          </p>
        </div>
      </div>
    </aside>
  );
};
