import { Link } from "@tanstack/react-router";
import { Check, Heart, Plus } from "lucide-react";
import type { SerialDetailResponse } from "@/features/serials/api";
import { LogSeriesModal } from "@/features/serials/components/LogSeriesModal";
import { getPosterUrl } from "@/features/serials/components/utils";
import { SpaceRatingInput } from "@/features/films/components/SpaceRating";
import { formatRatingOutOfFiveLabel } from "@/features/films/components/spaceRating.utils";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";

type SerialActionsSidebarProps = {
  detail: SerialDetailResponse;
  currentRatingOutOfFive: number | null;
  isRatingSaving: boolean;
  onRatingChange: (ratingOutOfFive: number | null) => void;
  isAuthenticated: boolean;
  watchlisted: boolean;
  liked: boolean;
  isInteractionBusy: boolean;
  onToggleWatchlist: () => void;
  onToggleLike: () => void;
};

export const SerialActionsSidebar = ({
  detail,
  currentRatingOutOfFive,
  isRatingSaving,
  onRatingChange,
  isAuthenticated,
  watchlisted,
  liked,
  isInteractionBusy,
  onToggleWatchlist,
  onToggleLike,
}: SerialActionsSidebarProps) => {
  const series = detail.series;

  const modalInitialState = {
    watchedDate: detail.userRating?.watchedDate ?? null,
    ratingOutOfFive: currentRatingOutOfFive,
    rewatch: detail.userRating?.rewatch ?? false,
    reviewContent: detail.userRating?.reviewContent ?? null,
    containsSpoilers: detail.userRating?.reviewContainsSpoilers ?? null,
  };

  const resolvedUserRatingLabel =
    formatRatingOutOfFiveLabel(currentRatingOutOfFive) ??
    "No rating yet";

  return (
    <aside>
      <div
        className="mb-4 aspect-2/3 overflow-hidden border"
        style={{ borderColor: SERIAL_MODULE_STYLES.border }}
      >
        <img
          src={getPosterUrl(series.posterPath)}
          alt={`${series.title} poster`}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <LogSeriesModal
            tmdbId={series.tmdbId}
            seriesTitle={series.title}
            seriesFirstAirYear={series.firstAirYear}
            seriesPosterPath={series.posterPath}
            initialState={modalInitialState}
            triggerVariant="outline"
            triggerLabel="Log"
            triggerClassName="h-auto border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
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
              className="flex items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: watchlisted
                  ? SERIAL_MODULE_STYLES.accent
                  : SERIAL_MODULE_STYLES.border,
                color: watchlisted
                  ? SERIAL_MODULE_STYLES.accent
                  : SERIAL_MODULE_STYLES.muted,
                background: "transparent",
              }}
              onClick={onToggleWatchlist}
            >
              {watchlisted ? (
                <Check className="h-3 w-3" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              <span>{watchlisted ? "watchlisted" : "watchlist"}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{
                borderColor: SERIAL_MODULE_STYLES.border,
                color: SERIAL_MODULE_STYLES.muted,
              }}
              viewTransition
            >
              <Plus className="h-3 w-3" />
              <span>Queue</span>
            </Link>
          )}
        </div>

        {isAuthenticated ? (
          <button
            type="button"
            disabled={isInteractionBusy}
            className="flex w-full items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-all disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: liked
                ? SERIAL_MODULE_STYLES.accent
                : SERIAL_MODULE_STYLES.border,
              color: liked
                ? SERIAL_MODULE_STYLES.accent
                : SERIAL_MODULE_STYLES.muted,
              background: "transparent",
            }}
            onClick={onToggleLike}
          >
            <Heart className="h-3 w-3" />
            <span>{liked ? "Liked" : "Like"}</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
            style={{
              borderColor: SERIAL_MODULE_STYLES.border,
              color: SERIAL_MODULE_STYLES.muted,
            }}
            viewTransition
          >
            <Heart className="h-3 w-3" />
            <span>Like</span>
          </Link>
        )}

        <div
          className="border p-3"
          style={{
            borderColor: SERIAL_MODULE_STYLES.border,
            background: SERIAL_MODULE_STYLES.panelElevated,
          }}
        >
          <p
            className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: SERIAL_MODULE_STYLES.faint }}
          >
            Your Rating
          </p>
          {isAuthenticated ? (
            <SpaceRatingInput
              value={currentRatingOutOfFive}
              onChange={onRatingChange}
              disabled={isRatingSaving}
            />
          ) : (
            <Link
              to="/login"
              className="font-mono text-[10px]"
              style={{ color: SERIAL_MODULE_STYLES.muted }}
              viewTransition
            >
              Sign in to rate
            </Link>
          )}
          <p
            className="mt-2 font-mono text-[10px]"
            style={{ color: SERIAL_MODULE_STYLES.muted }}
          >
            {isRatingSaving ? "Saving..." : resolvedUserRatingLabel}
          </p>
        </div>
      </div>
    </aside>
  );
};
