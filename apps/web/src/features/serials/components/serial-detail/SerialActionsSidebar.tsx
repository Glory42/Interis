import { Check, Heart, Plus, Tv } from "lucide-react";
import type { SerialDetailResponse } from "@/features/serials/api";
import { LogSeriesModal } from "@/features/serials/components/LogSeriesModal";
import { getPosterUrl } from "@/features/serials/components/utils";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";
import { AddToListDialog } from "@/features/lists/components/AddToListDialog";
import { MediaActionButton } from "@/features/media/components/MediaActionButton";
import { MediaCoverImage } from "@/features/media/components/MediaCoverImage";
import { MediaRatingPanel } from "@/features/media/components/MediaRatingPanel";

type SerialActionsSidebarProps = {
  detail: SerialDetailResponse;
  currentRating: number | null;
  isRatingSaving: boolean;
  onRatingChange: (rating: number | null) => void;
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
  currentRating,
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
    rating: currentRating,
    rewatch: detail.userRating?.rewatch ?? false,
    reviewContent: detail.userRating?.reviewContent ?? null,
    containsSpoilers: detail.userRating?.reviewContainsSpoilers ?? null,
  };

  return (
    <aside>
      <MediaCoverImage
        src={getPosterUrl(series.posterPath)}
        alt={`${series.title} poster`}
        fallbackIcon={Tv}
        fallbackLabel="No Art"
        accentColor={SERIAL_MODULE_STYLES.accent}
        panelColor={SERIAL_MODULE_STYLES.panelSoft}
        panelStrongColor={SERIAL_MODULE_STYLES.panelStrong}
        faintColor={SERIAL_MODULE_STYLES.faint}
        borderColor={SERIAL_MODULE_STYLES.border}
      />

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
            triggerClassName="h-auto rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
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
            isActive={watchlisted}
            disabled={isInteractionBusy}
            onClick={onToggleWatchlist}
            accentColor={SERIAL_MODULE_STYLES.accent}
            mutedColor={SERIAL_MODULE_STYLES.muted}
            borderColor={SERIAL_MODULE_STYLES.border}
            className="flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="flex gap-2">
          <MediaActionButton
            icon={Check}
            label="Watch"
            activeLabel="Watched"
            isAuthenticated={isAuthenticated}
            isActive={watched}
            disabled={isInteractionBusy}
            onClick={onToggleWatched}
            accentColor={SERIAL_MODULE_STYLES.accent}
            mutedColor={SERIAL_MODULE_STYLES.muted}
            borderColor={SERIAL_MODULE_STYLES.border}
          />

          <MediaActionButton
            icon={Heart}
            label="Like"
            activeLabel="Liked"
            isAuthenticated={isAuthenticated}
            isActive={liked}
            disabled={isInteractionBusy}
            onClick={onToggleLike}
            accentColor={SERIAL_MODULE_STYLES.accent}
            mutedColor={SERIAL_MODULE_STYLES.muted}
            borderColor={SERIAL_MODULE_STYLES.border}
          />
        </div>

        {isAuthenticated ? (
          <AddToListDialog
            tmdbId={series.tmdbId}
            itemType="serial"
            triggerClassName="flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors"
            triggerStyle={{
              borderColor: SERIAL_MODULE_STYLES.border,
              color: SERIAL_MODULE_STYLES.muted,
            }}
          />
        ) : null}

        <MediaRatingPanel
          isAuthenticated={isAuthenticated}
          value={currentRating}
          onChange={onRatingChange}
          disabled={isRatingSaving}
          accentColor={SERIAL_MODULE_STYLES.accent}
          mutedColor={SERIAL_MODULE_STYLES.muted}
          borderColor={SERIAL_MODULE_STYLES.border}
          panelColor={SERIAL_MODULE_STYLES.panelElevated}
          faintColor={SERIAL_MODULE_STYLES.faint}
        />

        {isAuthenticated && detail.viewerTracking && (
          <div
            className="rounded-xl border p-3 space-y-3"
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
