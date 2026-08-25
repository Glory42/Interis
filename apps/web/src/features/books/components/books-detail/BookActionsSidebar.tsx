import { Link } from "@tanstack/react-router";
import { BookOpen, Check, Heart, Plus } from "lucide-react";
import type { BookDetailResponse } from "@/features/books/api";
import { SpaceRatingInput } from "@/features/films/components/SpaceRating";
import { BOOK_MODULE_STYLES } from "@/features/books/components/books-detail/styles";

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
      <div
        className="mb-4 aspect-2/3 overflow-hidden border"
        style={{ borderColor: BOOK_MODULE_STYLES.border }}
      >
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={`${book.title} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-3"
            style={{ background: BOOK_MODULE_STYLES.panelSoft }}
          >
            <BookOpen className="h-10 w-10" style={{ color: BOOK_MODULE_STYLES.accent }} />
            <span
              className="font-mono text-[9px] uppercase tracking-[0.22em]"
              style={{ color: BOOK_MODULE_STYLES.faint }}
            >
              No Cover
            </span>
          </div>
        )}
      </div>

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

          {isAuthenticated ? (
            <button
              type="button"
              disabled={isInteractionBusy}
              className="flex items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: wantToRead
                  ? BOOK_MODULE_STYLES.accent
                  : BOOK_MODULE_STYLES.border,
                color: wantToRead ? BOOK_MODULE_STYLES.accent : BOOK_MODULE_STYLES.muted,
                background: "transparent",
              }}
              onClick={onToggleWantToRead}
            >
              {wantToRead ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              <span>{wantToRead ? "Queued" : "Queue"}</span>
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
              borderColor: liked ? BOOK_MODULE_STYLES.accent : BOOK_MODULE_STYLES.border,
              color: liked ? BOOK_MODULE_STYLES.accent : BOOK_MODULE_STYLES.muted,
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
              borderColor: BOOK_MODULE_STYLES.border,
              color: BOOK_MODULE_STYLES.muted,
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
            borderColor: BOOK_MODULE_STYLES.border,
            background: BOOK_MODULE_STYLES.panelElevated,
          }}
        >
          <p
            className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: BOOK_MODULE_STYLES.faint }}
          >
            Your Rating
          </p>
          {isAuthenticated ? (
            <SpaceRatingInput
              value={currentRating}
              onChange={onRatingChange}
              disabled={isRatingSaving}
            />
          ) : (
            <Link
              to="/login"
              className="font-mono text-[10px]"
              style={{ color: BOOK_MODULE_STYLES.muted }}
              viewTransition
            >
              Sign in to rate
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
};
