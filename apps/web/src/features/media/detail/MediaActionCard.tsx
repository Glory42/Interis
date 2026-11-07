import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LaunchTrack } from "@/components/film/rating/LaunchTrack";
import { AddToListDialog } from "@/features/lists/components/AddToListDialog";
import type { MediaAction } from "@/features/media/detail/MediaActionsSidebar";
import { formatWatchedLabel } from "@/features/media/detail/watched-label";
import type { MediaModuleStyles } from "@/features/media/styles";

type MediaActionCardProps = {
  moduleStyles: MediaModuleStyles;
  logSlot: ReactNode;
  tmdbId: number;
  itemType: "movie" | "serial";
  viewerUsername: string | null;
  // The viewer's latest watch, shown as "Watched Nov 2 · view diary" under Log.
  lastWatchedDate?: string | null;
  currentRating: number | null;
  onRatingChange: (rating: number | null) => void;
  isRatingSaving: boolean;
  isAuthenticated: boolean;
  isInteractionBusy: boolean;
  isInteractionLoading?: boolean;
  // Watched, liked and watchlist, in that order; Lists is added after them.
  actions: MediaAction[];
};

const segmentClass =
  "flex min-h-14 flex-col items-center justify-center gap-1 border-l border-[color:var(--line)] text-[11px] transition-colors first:border-l-0 disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:size-4";

const scoreLabel = (rating: number) => (Number.isInteger(rating) ? String(rating) : rating.toFixed(1));

// One primary Log, a row of quick toggles, and the rocket rating under them.
export const MediaActionCard = ({
  moduleStyles,
  logSlot,
  tmdbId,
  itemType,
  viewerUsername,
  lastWatchedDate,
  currentRating,
  onRatingChange,
  isRatingSaving,
  isAuthenticated,
  isInteractionBusy,
  isInteractionLoading = false,
  actions,
}: MediaActionCardProps) => {
  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--line-strong)] p-4">
        <p className="body font-semibold text-foreground">{itemType === "movie" ? "Track this film" : "Track this show"}</p>
        <p className="body-s mt-0.5 text-muted-foreground">Sign in to log, rate and review it.</p>
        <Link
          to="/login"
          className="mt-3 inline-flex rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/85"
          viewTransition
        >
          Sign in
        </Link>
      </div>
    );
  }

  const watchedLabel = formatWatchedLabel(lastWatchedDate);

  return (
    <div className="space-y-3">
      <div>
        {logSlot}
        {watchedLabel ? (
          <p className="body-s mt-1.5 text-center text-muted-foreground">
            {watchedLabel}
            {viewerUsername ? (
              <>
                {" · "}
                <Link to="/profile/$username/diary" params={{ username: viewerUsername }} className="text-primary hover:underline">
                  view diary
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <div role="group" aria-label="Your activity" className="grid grid-cols-4 overflow-hidden rounded-xl border border-[color:var(--line)]">
        {actions.map((action) => {
          const isActive = !isInteractionLoading && action.isActive;
          const activeColor = action.key === "liked" ? "var(--like)" : "var(--primary)";
          return (
            <button
              key={action.key}
              type="button"
              aria-pressed={isActive}
              disabled={isInteractionBusy}
              onClick={action.onToggle}
              className={segmentClass}
              style={{ color: isActive ? activeColor : moduleStyles.muted }}
            >
              {isActive ? action.activeIcon : action.inactiveIcon}
              <span>{isActive ? action.activeLabel : action.inactiveLabel}</span>
            </button>
          );
        })}
        <AddToListDialog
          tmdbId={tmdbId}
          itemType={itemType}
          triggerClassName={segmentClass}
          triggerStyle={{ color: moduleStyles.muted }}
        />
      </div>

      <div
        role="group"
        aria-label="Your rating"
        className="rounded-xl border px-3.5 pt-3 pb-3.5"
        style={{ borderColor: moduleStyles.border, background: moduleStyles.panelElevated }}
      >
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[11px] tracking-[0.06em] text-muted-foreground">Your rating</span>
          <span className="font-mono text-xl font-bold text-primary">
            {currentRating === null ? "–" : scoreLabel(currentRating)}
            <span className="text-xs font-normal text-muted-foreground">/10</span>
          </span>
        </div>
        <LaunchTrack
          value={currentRating}
          onCommit={onRatingChange}
          disabled={isRatingSaving}
          footer="scale"
          className="mt-1 max-w-none"
        />
        <p className="mt-1.5 text-[11px] text-muted-foreground/80">
          {currentRating === null
            ? "Drag or tap · saves on release"
            : `Drag or tap · saves on release · tap ${scoreLabel(currentRating)} again to clear`}
        </p>
      </div>
    </div>
  );
};
