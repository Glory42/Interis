import { Link } from "@tanstack/react-router";
import { BookOpen, Check, Heart, Plus } from "lucide-react";
import type { BookDetailResponse } from "@/features/books/api";
import { BOOK_MODULE_STYLES } from "@/features/books/components/books-detail/styles";
import { MediaActionButton } from "@/features/media/components/MediaActionButton";
import { MediaCoverImage } from "@/features/media/components/MediaCoverImage";
import { MediaRatingPanel } from "@/features/media/components/MediaRatingPanel";

const TOGGLE_BUTTON_CLASSNAME =
  "flex items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-all disabled:cursor-not-allowed disabled:opacity-60";

type BookActionsSidebarProps = {
  detail: BookDetailResponse;
  currentRating: number | null;
  isRatingSaving: boolean;
  onRatingChange: (rating: number | null) => void;
  isAuthenticated: boolean;
  wantToRead: boolean;
  liked: boolean;
  isInteractionBusy: boolean;
  onToggleWantToRead: () => void;
  onToggleLike: () => void;
  onOpenLog: () => void;
};

export const BookActionsSidebar = ({
  detail,
  currentRating,
  isRatingSaving,
  onRatingChange,
  isAuthenticated,
  wantToRead,
  liked,
  isInteractionBusy,
  onToggleWantToRead,
  onToggleLike,
  onOpenLog,
}: BookActionsSidebarProps) => {
  const book = detail.book;

  return (
    <aside>
      <MediaCoverImage
        src={book.coverImageUrl}
        alt={`${book.title} cover`}
        fallbackIcon={BookOpen}
        fallbackLabel="No Cover"
        accentColor={BOOK_MODULE_STYLES.accent}
        panelColor={BOOK_MODULE_STYLES.panelSoft}
        panelStrongColor={BOOK_MODULE_STYLES.panelStrong}
        faintColor={BOOK_MODULE_STYLES.faint}
        borderColor={BOOK_MODULE_STYLES.border}
      />

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={onOpenLog}
              className="flex items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-all"
              style={{
                borderColor: BOOK_MODULE_STYLES.border,
                color: BOOK_MODULE_STYLES.muted,
              }}
            >
              <Check className="h-3 w-3" />
              <span>Log</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{
                borderColor: BOOK_MODULE_STYLES.border,
                color: BOOK_MODULE_STYLES.muted,
              }}
              viewTransition
            >
              <Check className="h-3 w-3" />
              <span>Log</span>
            </Link>
          )}

          <MediaActionButton
            icon={Plus}
            activeIcon={Check}
            label="Queue"
            activeLabel="Queued"
            isAuthenticated={isAuthenticated}
            isActive={wantToRead}
            disabled={isInteractionBusy}
            onClick={onToggleWantToRead}
            accentColor={BOOK_MODULE_STYLES.accent}
            mutedColor={BOOK_MODULE_STYLES.muted}
            borderColor={BOOK_MODULE_STYLES.border}
            className={TOGGLE_BUTTON_CLASSNAME}
          />
        </div>

        <MediaActionButton
          icon={Heart}
          label="Like"
          activeLabel="Liked"
          isAuthenticated={isAuthenticated}
          isActive={liked}
          disabled={isInteractionBusy}
          onClick={onToggleLike}
          accentColor={BOOK_MODULE_STYLES.accent}
          mutedColor={BOOK_MODULE_STYLES.muted}
          borderColor={BOOK_MODULE_STYLES.border}
          className={`w-full ${TOGGLE_BUTTON_CLASSNAME}`}
        />

        <MediaRatingPanel
          isAuthenticated={isAuthenticated}
          value={currentRating}
          onChange={onRatingChange}
          disabled={isRatingSaving}
          accentColor={BOOK_MODULE_STYLES.accent}
          mutedColor={BOOK_MODULE_STYLES.muted}
          borderColor={BOOK_MODULE_STYLES.border}
          panelColor={BOOK_MODULE_STYLES.panelElevated}
          faintColor={BOOK_MODULE_STYLES.faint}
        />
      </div>
    </aside>
  );
};
