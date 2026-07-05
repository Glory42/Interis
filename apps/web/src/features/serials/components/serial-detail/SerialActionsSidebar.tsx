import { Link } from "@tanstack/react-router";
import { Check, Heart, Plus } from "lucide-react";
import type { SerialDetailResponse } from "@/features/serials/api";
import { LogSeriesModal } from "@/features/serials/components/LogSeriesModal";
import { getPosterUrl } from "@/features/serials/components/utils";
import { SpaceRatingInput } from "@/features/films/components/SpaceRating";
import { formatRatingOutOfFiveLabel } from "@/features/films/components/spaceRating.utils";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";
import { AddToListDialog } from "@/features/lists/components/AddToListDialog";

type SerialActionsSidebarProps = {
  detail: SerialDetailResponse;
  currentRatingOutOfFive: number | null;
  isRatingSaving: boolean;
  onRatingChange: (ratingOutOfFive: number | null) => void;
  isAuthenticated: boolean;
  watchlisted: boolean;
  liked: boolean;
  watched: boolean;
  isInteractionBusy: boolean;
  onToggleWatchlist: () => void;
  onToggleLike: () => void;
  onToggleWatched: () => void;
};

export const SerialActionsSidebar = ({
  detail,
  currentRatingOutOfFive,
  isRatingSaving,
  onRatingChange,
  isAuthenticated,
  watchlisted,
  liked,
  watched,
  isInteractionBusy,
  onToggleWatchlist,
  onToggleLike,
  onToggleWatched,
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

        <div className="flex gap-2">
          {isAuthenticated ? (
            <button
              type="button"
              disabled={isInteractionBusy}
              className="flex flex-1 items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: watched
                  ? SERIAL_MODULE_STYLES.accent
                  : SERIAL_MODULE_STYLES.border,
                color: watched
                  ? SERIAL_MODULE_STYLES.accent
                  : SERIAL_MODULE_STYLES.muted,
                background: "transparent",
              }}
              onClick={onToggleWatched}
            >
              <Check className="h-3 w-3" />
              <span>{watched ? "Watched" : "Watch"}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex flex-1 items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{
                borderColor: SERIAL_MODULE_STYLES.border,
                color: SERIAL_MODULE_STYLES.muted,
              }}
              viewTransition
            >
              <Check className="h-3 w-3" />
              <span>Watch</span>
            </Link>
          )}

          {isAuthenticated ? (
            <button
              type="button"
              disabled={isInteractionBusy}
              className="flex flex-1 items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-all disabled:cursor-not-allowed disabled:opacity-60"
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
              className="flex flex-1 items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
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
        </div>

        {isAuthenticated ? (
          <AddToListDialog
            tmdbId={series.tmdbId}
            itemType="serial"
            triggerClassName="flex w-full items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-all"
            triggerStyle={{
              borderColor: SERIAL_MODULE_STYLES.border,
              color: SERIAL_MODULE_STYLES.muted,
            }}
          />
        ) : null}

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

        {isAuthenticated && detail.viewerTracking && (
          <div
            className="border p-3 space-y-3"
            style={{
              borderColor: SERIAL_MODULE_STYLES.border,
              background: SERIAL_MODULE_STYLES.panelElevated,
            }}
          >
            <p
              className="font-mono text-[9px] uppercase tracking-[0.22em]"
              style={{ color: SERIAL_MODULE_STYLES.faint }}
            >
              Your Progress
            </p>

            <div className="space-y-1.5 font-mono text-[11px]" style={{ color: SERIAL_MODULE_STYLES.muted }}>
              <div className="flex justify-between">
                <span>Episodes:</span>
                <span className="font-bold text-foreground">
                  {detail.viewerTracking.watchedEpisodesCount} / {series.numberOfEpisodes ?? "?"}
                </span>
              </div>

              {detail.viewerTracking.currentEpisode ? (
                <div className="flex justify-between">
                  <span>Up Next:</span>
                  <span className="font-bold text-foreground font-semibold" style={{ color: SERIAL_MODULE_STYLES.accent }}>
                    S{detail.viewerTracking.currentEpisode.seasonNumber}E{detail.viewerTracking.currentEpisode.episodeNumber}
                  </span>
                </div>
              ) : (
                <div className="text-[10px] text-green-500 font-semibold uppercase tracking-wider">
                  ✓ Series Completed
                </div>
              )}
            </div>

            <div className="border-t pt-2 mt-2 space-y-1 font-mono text-[10px]" style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft, color: SERIAL_MODULE_STYLES.faint }}>
              <div className="flex justify-between">
                <span>Ratings (S/E):</span>
                <span>{detail.viewerTracking.ratingsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Likes (S/E):</span>
                <span>{detail.viewerTracking.likesCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Reviews (S/E):</span>
                <span>{detail.viewerTracking.reviewsCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
