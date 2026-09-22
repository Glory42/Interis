import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AddToListDialog } from "@/features/lists/components/AddToListDialog";
import { SpaceRatingInput } from "@/features/movies/components/SpaceRating";
import { RatingPanelStarfield } from "@/features/media/detail/RatingPanelStarfield";
import type { MediaModuleStyles } from "@/features/media/styles";

export type MediaAction = {
  key: string;
  isActive: boolean;
  activeIcon: ReactNode;
  inactiveIcon: ReactNode;
  activeLabel: string;
  inactiveLabel: string;
  loginLabel: string;
  onToggle: () => void;
};

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
  isInteractionBusy: boolean;
  isInteractionLoading?: boolean;
  // First entry sits beside logModalSlot; the rest fill their own row.
  actions: [MediaAction, ...MediaAction[]];
  trailingSlot?: ReactNode;
};

const toggleButtonClassName =
  "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const loginLinkClassName =
  "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]";

// The one place that owns "what a toggle action looks like": authenticated
// active/inactive styling plus the unauthenticated login-link fallback.
// Every action (watchlist, watched, liked, ...) renders through here
// instead of three near-identical inline blocks.
const ActionButton = ({
  action,
  isAuthenticated,
  isInteractionBusy,
  isInteractionLoading,
  moduleStyles,
}: {
  action: MediaAction;
  isAuthenticated: boolean;
  isInteractionBusy: boolean;
  isInteractionLoading: boolean;
  moduleStyles: MediaModuleStyles;
}) => {
  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className={loginLinkClassName}
        style={{ borderColor: moduleStyles.border, color: moduleStyles.muted }}
        viewTransition
      >
        {action.inactiveIcon}
        <span>{action.loginLabel}</span>
      </Link>
    );
  }

  const isActive = !isInteractionLoading && action.isActive;

  return (
    <button
      type="button"
      disabled={isInteractionBusy}
      className={toggleButtonClassName}
      style={{
        borderColor: isActive ? moduleStyles.accent : moduleStyles.border,
        color: isActive ? moduleStyles.accent : moduleStyles.muted,
        background: "transparent",
      }}
      onClick={action.onToggle}
    >
      {isActive ? action.activeIcon : action.inactiveIcon}
      <span>{isActive ? action.activeLabel : action.inactiveLabel}</span>
    </button>
  );
};

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
  isInteractionBusy,
  isInteractionLoading = false,
  actions,
  trailingSlot,
}: MediaActionsSidebarProps) => {
  const [firstAction, ...restActions] = actions;

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
          <ActionButton
            action={firstAction}
            isAuthenticated={isAuthenticated}
            isInteractionBusy={isInteractionBusy}
            isInteractionLoading={isInteractionLoading}
            moduleStyles={moduleStyles}
          />
        </div>

        {restActions.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {restActions.map((action) => (
              <ActionButton
                key={action.key}
                action={action}
                isAuthenticated={isAuthenticated}
                isInteractionBusy={isInteractionBusy}
                isInteractionLoading={isInteractionLoading}
                moduleStyles={moduleStyles}
              />
            ))}
          </div>
        ) : null}

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
