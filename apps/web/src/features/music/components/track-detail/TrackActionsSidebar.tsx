import { Check, Heart, Music } from "lucide-react";
import type { TrackDetailResponse } from "@/features/music/track-api";
import { MUSIC_MODULE_STYLES } from "@/features/music/components/music-detail/styles";
import { MediaActionButton } from "@/features/media/components/MediaActionButton";
import { MediaCoverImage } from "@/features/media/components/MediaCoverImage";
import { MediaRatingPanel } from "@/features/media/components/MediaRatingPanel";

type TrackActionsSidebarProps = {
  detail: TrackDetailResponse;
  currentRating: number | null;
  isRatingSaving: boolean;
  onRatingChange: (rating: number | null) => void;
  isAuthenticated: boolean;
  liked: boolean;
  isInteractionBusy: boolean;
  onToggleLike: () => void;
  onOpenLog: () => void;
};

export const TrackActionsSidebar = ({
  detail,
  currentRating,
  isRatingSaving,
  onRatingChange,
  isAuthenticated,
  liked,
  isInteractionBusy,
  onToggleLike,
  onOpenLog,
}: TrackActionsSidebarProps) => {
  return (
    <aside>
      <MediaCoverImage
        src={null}
        alt={`${detail.track.title} art`}
        fallbackIcon={Music}
        fallbackLabel="Track"
        aspectClassName="aspect-square"
        accentColor={MUSIC_MODULE_STYLES.accent}
        panelColor={MUSIC_MODULE_STYLES.panelSoft}
        panelStrongColor={MUSIC_MODULE_STYLES.panelStrong}
        faintColor={MUSIC_MODULE_STYLES.faint}
        borderColor={MUSIC_MODULE_STYLES.border}
      />

      <div className="space-y-2">
        <MediaActionButton
          icon={Check}
          label="Log"
          isAuthenticated={isAuthenticated}
          onClick={onOpenLog}
          accentColor={MUSIC_MODULE_STYLES.accent}
          mutedColor={MUSIC_MODULE_STYLES.muted}
          borderColor={MUSIC_MODULE_STYLES.border}
          className="flex w-full items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-all"
        />

        <MediaActionButton
          icon={Heart}
          label="Like"
          activeLabel="Liked"
          isAuthenticated={isAuthenticated}
          isActive={liked}
          disabled={isInteractionBusy}
          onClick={onToggleLike}
          accentColor={MUSIC_MODULE_STYLES.accent}
          mutedColor={MUSIC_MODULE_STYLES.muted}
          borderColor={MUSIC_MODULE_STYLES.border}
          className="flex w-full items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-all disabled:cursor-not-allowed disabled:opacity-60"
        />

        <MediaRatingPanel
          isAuthenticated={isAuthenticated}
          value={currentRating}
          onChange={onRatingChange}
          disabled={isRatingSaving}
          accentColor={MUSIC_MODULE_STYLES.accent}
          mutedColor={MUSIC_MODULE_STYLES.muted}
          borderColor={MUSIC_MODULE_STYLES.border}
          panelColor={MUSIC_MODULE_STYLES.panelElevated}
          faintColor={MUSIC_MODULE_STYLES.faint}
        />
      </div>
    </aside>
  );
};
