import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Heart, Plus } from "lucide-react";
import { AddToListDialog } from "@/features/lists/components/AddToListDialog";
import { SpaceRatingInput } from "@/features/movies/components/SpaceRating";
import { RatingPanelStarfield } from "@/features/media/detail/RatingPanelStarfield";
import type { MediaModuleStyles } from "@/features/media/styles";

type MediaActionsSidebarProps = {
  moduleStyles: MediaModuleStyles;
  posterSlot: ReactNode;
  logModalSlot: ReactNode;
  tmdbId: number;
  itemType: "movie" | "serial";
  currentRating: number | null;
  isRatingSaving: boolean;
  onRatingChange: (rating: number | null) => void;
  isAuthenticated: boolean;
  watchlisted: boolean;
  liked: boolean;
  watched: boolean;
  isInteractionBusy: boolean;
  isInteractionLoading?: boolean;
  onToggleWatchlist: () => void;
  onToggleLike: () => void;
  onToggleWatched: () => void;
  trailingSlot?: ReactNode;
};

const toggleButtonClassName =
  "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const loginLinkClassName =
  "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]";

export const MediaActionsSidebar = ({
  moduleStyles,
  posterSlot,
  logModalSlot,
  tmdbId,
  itemType,
  currentRating,
  isRatingSaving,
  onRatingChange,
  isAuthenticated,
  watchlisted,
  liked,
  watched,
  isInteractionBusy,
  isInteractionLoading = false,
  onToggleWatchlist,
  onToggleLike,
  onToggleWatched,
  trailingSlot,
}: MediaActionsSidebarProps) => {
  return (
    <aside>
      <div
        className="mb-4 aspect-2/3 overflow-hidden rounded-xl border"
        style={{ borderColor: moduleStyles.border }}
      >
        {posterSlot}
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {logModalSlot}

          {isAuthenticated ? (
            <button
              type="button"
              disabled={isInteractionBusy}
              className={toggleButtonClassName}
              style={{
                borderColor: !isInteractionLoading && watchlisted
                  ? moduleStyles.accent
                  : moduleStyles.border,
                color: !isInteractionLoading && watchlisted
                  ? moduleStyles.accent
                  : moduleStyles.muted,
                background: "transparent",
              }}
              onClick={onToggleWatchlist}
            >
              {!isInteractionLoading && watchlisted ? (
                <Check className="h-3 w-3" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              <span>{!isInteractionLoading && watchlisted ? "watchlisted" : "watchlist"}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className={loginLinkClassName}
              style={{ borderColor: moduleStyles.border, color: moduleStyles.muted }}
              viewTransition
            >
              <Plus className="h-3 w-3" />
              <span>Queue</span>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {isAuthenticated ? (
            <button
              type="button"
              disabled={isInteractionBusy}
              className={toggleButtonClassName}
              style={{
                borderColor: !isInteractionLoading && watched
                  ? moduleStyles.accent
                  : moduleStyles.border,
                color: !isInteractionLoading && watched
                  ? moduleStyles.accent
                  : moduleStyles.muted,
                background: "transparent",
              }}
              onClick={onToggleWatched}
            >
              <Check className="h-3 w-3" />
              <span>{!isInteractionLoading && watched ? "Watched" : "Watch"}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className={loginLinkClassName}
              style={{ borderColor: moduleStyles.border, color: moduleStyles.muted }}
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
              className={toggleButtonClassName}
              style={{
                borderColor: !isInteractionLoading && liked
                  ? moduleStyles.accent
                  : moduleStyles.border,
                color: !isInteractionLoading && liked
                  ? moduleStyles.accent
                  : moduleStyles.muted,
                background: "transparent",
              }}
              onClick={onToggleLike}
            >
              <Heart className="h-3 w-3" />
              <span>{!isInteractionLoading && liked ? "Liked" : "Like"}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className={loginLinkClassName}
              style={{ borderColor: moduleStyles.border, color: moduleStyles.muted }}
              viewTransition
            >
              <Heart className="h-3 w-3" />
              <span>Like</span>
            </Link>
          )}
        </div>

        {isAuthenticated ? (
          <AddToListDialog
            tmdbId={tmdbId}
            itemType={itemType}
            triggerClassName="flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors"
            triggerStyle={{
              borderColor: moduleStyles.border,
              color: moduleStyles.muted,
            }}
          />
        ) : null}

        <div
          className="relative overflow-hidden rounded-xl border p-3"
          style={{
            borderColor: moduleStyles.border,
            background: moduleStyles.panelElevated,
          }}
        >
          <RatingPanelStarfield accentColor={moduleStyles.accent} />

          <p
            className="relative mb-2 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: moduleStyles.faint }}
          >
            Your Rating
          </p>
          <div className="relative flex items-center gap-3">
            {isAuthenticated ? (
              <SpaceRatingInput
                value={currentRating}
                onChange={onRatingChange}
                disabled={isRatingSaving}
                accentColor={moduleStyles.accent}
              />
            ) : (
              <Link
                to="/login"
                className="font-mono text-[10px]"
                style={{ color: moduleStyles.muted }}
                viewTransition
              >
                Sign in to rate
              </Link>
            )}
          </div>
        </div>

        {trailingSlot}
      </div>
    </aside>
  );
};
