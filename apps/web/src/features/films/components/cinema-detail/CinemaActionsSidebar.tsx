import { Award, Check, Heart, Plus } from "lucide-react";
import { LogFilmModal } from "@/features/diary/components/LogFilmModal";
import type { MovieDetailResponse } from "@/features/films/api";
import { CINEMA_MODULE_STYLES } from "@/features/films/components/cinema-detail/styles";
import { getPosterUrl } from "@/features/films/components/utils";
import { AddToListDialog } from "@/features/lists/components/AddToListDialog";
import { MediaActionButton } from "@/features/media/components/MediaActionButton";
import { MediaCoverImage } from "@/features/media/components/MediaCoverImage";
import { MediaRatingPanel } from "@/features/media/components/MediaRatingPanel";

type CinemaActionsSidebarProps = {
  detail: MovieDetailResponse;
  currentRating: number | null;
  isRatingSaving: boolean;
  onRatingChange: (rating: number | null) => void;
  isAuthenticated: boolean;
  watchlisted: boolean;
  liked: boolean;
  watched: boolean;
  isInteractionBusy: boolean;
  isInteractionLoading: boolean;
  onToggleWatchlist: () => void;
  onToggleLike: () => void;
  onToggleWatched: () => void;
};

export const CinemaActionsSidebar = ({
  detail,
  currentRating,
  isRatingSaving,
  onRatingChange,
  isAuthenticated,
  watchlisted,
  liked,
  watched,
  isInteractionBusy,
  isInteractionLoading,
  onToggleWatchlist,
  onToggleLike,
  onToggleWatched,
}: CinemaActionsSidebarProps) => {
  const movie = detail.movie;

  const modalInitialState = {
    watchedDate: detail.userRating?.watchedDate ?? null,
    rating: currentRating,
    rewatch: detail.userRating?.rewatch ?? false,
    reviewContent: detail.userRating?.reviewContent ?? null,
    containsSpoilers: detail.userRating?.reviewContainsSpoilers ?? null,
  };

  return (
    <aside>
      <MediaCoverImage
        src={movie.posterPath ? getPosterUrl(movie.posterPath) : null}
        alt={`${movie.title} poster`}
        fallbackIcon={Award}
        fallbackLabel="No Art"
        accentColor={CINEMA_MODULE_STYLES.accent}
        panelColor={CINEMA_MODULE_STYLES.panelSoft}
        panelStrongColor={CINEMA_MODULE_STYLES.panelStrong}
        faintColor={CINEMA_MODULE_STYLES.faint}
        borderColor={CINEMA_MODULE_STYLES.border}
      />

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <LogFilmModal
            tmdbId={movie.tmdbId}
            movieTitle={movie.title}
            movieReleaseYear={movie.releaseYear}
            moviePosterPath={movie.posterPath}
            initialState={modalInitialState}
            triggerVariant="outline"
            triggerLabel="Log"
            triggerClassName="h-auto flex-1 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
            triggerContent={
              <>
                <Check className="h-3 w-3" />
                <span>Log</span>
              </>
            }
          />

          <MediaActionButton
            icon={Plus}
            activeIcon={Check}
            label="Queue"
            activeLabel="Queued"
            isAuthenticated={isAuthenticated}
            isActive={!isInteractionLoading && watchlisted}
            disabled={isInteractionBusy}
            onClick={onToggleWatchlist}
            accentColor={CINEMA_MODULE_STYLES.accent}
            mutedColor={CINEMA_MODULE_STYLES.muted}
            borderColor={CINEMA_MODULE_STYLES.border}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MediaActionButton
            icon={Check}
            label="Watch"
            activeLabel="Watched"
            isAuthenticated={isAuthenticated}
            isActive={!isInteractionLoading && watched}
            disabled={isInteractionBusy}
            onClick={onToggleWatched}
            accentColor={CINEMA_MODULE_STYLES.accent}
            mutedColor={CINEMA_MODULE_STYLES.muted}
            borderColor={CINEMA_MODULE_STYLES.border}
          />

          <MediaActionButton
            icon={Heart}
            label="Like"
            activeLabel="Liked"
            isAuthenticated={isAuthenticated}
            isActive={!isInteractionLoading && liked}
            disabled={isInteractionBusy}
            onClick={onToggleLike}
            accentColor={CINEMA_MODULE_STYLES.accent}
            mutedColor={CINEMA_MODULE_STYLES.muted}
            borderColor={CINEMA_MODULE_STYLES.border}
          />
        </div>

        {isAuthenticated ? (
          <AddToListDialog
            tmdbId={movie.tmdbId}
            itemType="cinema"
            triggerClassName="flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors"
            triggerStyle={{
              borderColor: CINEMA_MODULE_STYLES.border,
              color: CINEMA_MODULE_STYLES.muted,
            }}
          />
        ) : null}

        <MediaRatingPanel
          isAuthenticated={isAuthenticated}
          value={currentRating}
          onChange={onRatingChange}
          disabled={isRatingSaving}
          accentColor={CINEMA_MODULE_STYLES.accent}
          mutedColor={CINEMA_MODULE_STYLES.muted}
          borderColor={CINEMA_MODULE_STYLES.border}
          panelColor={CINEMA_MODULE_STYLES.panelElevated}
          faintColor={CINEMA_MODULE_STYLES.faint}
        />
      </div>
    </aside>
  );
};
