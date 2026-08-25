import { Link } from "@tanstack/react-router";
import { Check, Heart, Music, Plus } from "lucide-react";
import type { MusicDetailResponse } from "@/features/music/api";
import { SpaceRatingInput } from "@/features/films/components/SpaceRating";
import { formatRatingOutOfFiveLabel } from "@/lib/rating-five-point";
import { MUSIC_MODULE_STYLES } from "@/features/music/components/music-detail/styles";

type AlbumActionsSidebarProps = {
  detail: MusicDetailResponse;
  currentRatingOutOfFive: number | null;
  isRatingSaving: boolean;
  onRatingChange: (ratingOutOfFive: number | null) => void;
  isAuthenticated: boolean;
  wantToListen: boolean;
  liked: boolean;
  isInteractionBusy: boolean;
  onToggleWantToListen: () => void;
  onToggleLike: () => void;
  onOpenLog: () => void;
};

export const AlbumActionsSidebar = ({
  detail,
  currentRatingOutOfFive,
  isRatingSaving,
  onRatingChange,
  isAuthenticated,
  wantToListen,
  liked,
  isInteractionBusy,
  onToggleWantToListen,
  onToggleLike,
  onOpenLog,
}: AlbumActionsSidebarProps) => {
  const album = detail.album;
  const ratingLabel = formatRatingOutOfFiveLabel(currentRatingOutOfFive) ?? "No rating yet";

  return (
    <aside>
      <div
        className="mb-4 aspect-square overflow-hidden border"
        style={{ borderColor: MUSIC_MODULE_STYLES.border }}
      >
        {album.coverArtUrl ? (
          <img
            src={album.coverArtUrl}
            alt={`${album.title} cover art`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-3"
            style={{ background: MUSIC_MODULE_STYLES.panelSoft }}
          >
            <Music className="h-10 w-10" style={{ color: MUSIC_MODULE_STYLES.accent }} />
            <span
              className="font-mono text-[9px] uppercase tracking-[0.22em]"
              style={{ color: MUSIC_MODULE_STYLES.faint }}
            >
              No Cover Art
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
                borderColor: MUSIC_MODULE_STYLES.border,
                color: MUSIC_MODULE_STYLES.muted,
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
                borderColor: MUSIC_MODULE_STYLES.border,
                color: MUSIC_MODULE_STYLES.muted,
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
                borderColor: wantToListen
                  ? MUSIC_MODULE_STYLES.accent
                  : MUSIC_MODULE_STYLES.border,
                color: wantToListen ? MUSIC_MODULE_STYLES.accent : MUSIC_MODULE_STYLES.muted,
                background: "transparent",
              }}
              onClick={onToggleWantToListen}
            >
              {wantToListen ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              <span>{wantToListen ? "Queued" : "Queue"}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{
                borderColor: MUSIC_MODULE_STYLES.border,
                color: MUSIC_MODULE_STYLES.muted,
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
              borderColor: liked ? MUSIC_MODULE_STYLES.accent : MUSIC_MODULE_STYLES.border,
              color: liked ? MUSIC_MODULE_STYLES.accent : MUSIC_MODULE_STYLES.muted,
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
              borderColor: MUSIC_MODULE_STYLES.border,
              color: MUSIC_MODULE_STYLES.muted,
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
            borderColor: MUSIC_MODULE_STYLES.border,
            background: MUSIC_MODULE_STYLES.panelElevated,
          }}
        >
          <p
            className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: MUSIC_MODULE_STYLES.faint }}
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
              style={{ color: MUSIC_MODULE_STYLES.muted }}
              viewTransition
            >
              Sign in to rate
            </Link>
          )}
          <p
            className="mt-2 font-mono text-[10px]"
            style={{ color: MUSIC_MODULE_STYLES.muted }}
          >
            {isRatingSaving ? "Saving..." : ratingLabel}
          </p>
        </div>
      </div>
    </aside>
  );
};
