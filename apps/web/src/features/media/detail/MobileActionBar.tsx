import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { LaunchTrack } from "@/components/film/rating/LaunchTrack";
import { ModalShell } from "@/components/ui/ModalShell";
import type { MediaAction } from "@/features/media/detail/MediaActionsSidebar";
import type { MediaModuleStyles } from "@/features/media/styles";
import { cn } from "@/lib/utils";

type MobileActionBarProps = {
  moduleStyles: MediaModuleStyles;
  logSlot: ReactNode;
  listSlot?: ReactNode;
  actions: MediaAction[];
  currentRating: number | null;
  onRatingChange: (rating: number | null) => void;
  isRatingSaving: boolean;
  isAuthenticated: boolean;
  isInteractionBusy: boolean;
  // "Write a review" inside the rating sheet.
  reviewSlot?: ReactNode;
};

const itemClass =
  "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 font-mono text-[10px] font-semibold tracking-[0.08em] uppercase";

// Phones only: Log, the toggles, List and your rocket score, sticky at the bottom of detail pages.
export const MobileActionBar = ({
  moduleStyles,
  logSlot,
  listSlot,
  actions,
  currentRating,
  onRatingChange,
  isRatingSaving,
  isAuthenticated,
  isInteractionBusy,
  reviewSlot,
}: MobileActionBarProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Portalled: a transformed ancestor would pin a fixed bar to the page instead of the viewport.
  if (!isAuthenticated) {
    return createPortal(
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--line)] bg-[color:var(--slate)] pb-[env(safe-area-inset-bottom)] md:hidden">
        <Link to="/login" className={cn(itemClass, "text-[#dddddd]")} viewTransition>
          Sign in to log and rate
        </Link>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <>
      <div
        role="toolbar"
        aria-label="Title actions"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-[color:var(--line)] bg-[color:var(--slate)] px-1 pb-[env(safe-area-inset-bottom)] text-[#8a8a8a] md:hidden"
      >
        <div className="flex flex-1 items-center justify-center">{logSlot}</div>
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            disabled={isInteractionBusy}
            onClick={action.onToggle}
            className={itemClass}
            style={action.isActive ? { color: moduleStyles.accent } : undefined}
          >
            {action.isActive ? action.activeIcon : action.inactiveIcon}
            {action.isActive ? action.activeLabel : action.inactiveLabel}
          </button>
        ))}
        {listSlot ? <div className="flex flex-1 items-center justify-center">{listSlot}</div> : null}
        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          aria-label={currentRating === null ? "Rate this" : `Your rating ${currentRating.toFixed(1)}`}
          className={cn(itemClass, "text-primary")}
        >
          <Rocket aria-hidden className="size-4" />
          {currentRating === null ? "Rate" : currentRating.toFixed(1)}
        </button>
      </div>

      {isSheetOpen ? (
        <ModalShell layout="sheet" onClose={() => setIsSheetOpen(false)} ariaCloseLabel="Close rating">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Your rating"
            className="w-full rounded-t-xl border-t border-[color:var(--line-strong)] bg-card px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)] animate-fade-up sm:max-w-md sm:rounded-md sm:border"
          >
            <div aria-hidden className="mx-auto mb-3 h-1 w-9 rounded-full bg-foreground/20" />
            <div className="mb-3 flex items-baseline justify-between">
              <p className="display-4 text-foreground">Your rating</p>
              <p className="mono-meta text-muted-foreground">Drag · half steps · saves on release</p>
            </div>
            <LaunchTrack
              value={currentRating}
              onCommit={onRatingChange}
              disabled={isRatingSaving}
              accentColor={moduleStyles.accent}
              confirmSaves
              className="max-w-none"
            />
            {reviewSlot ? <div className="mt-4 flex justify-center">{reviewSlot}</div> : null}
          </section>
        </ModalShell>
      ) : null}
    </>,
    document.body,
  );
};
