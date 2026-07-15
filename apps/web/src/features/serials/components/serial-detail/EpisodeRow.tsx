import { Heart, MessageSquare } from "lucide-react";
import type { SerialSeasonDetailResponse } from "@/features/serials/api";
import { getStillUrl } from "@/features/serials/components/utils";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";
import { toDateLabel, toEpisodeCodeLabel } from "@/features/serials/components/serial-detail/utils";
import { RatingSelect } from "@/features/serials/components/serial-detail/RatingSelect";

type Episode = SerialSeasonDetailResponse["episodes"][number];

type EpisodeRowProps = {
  episode: Episode;
  index: number;
  showInteractions: boolean;
  onToggleWatched: (episodeNumber: number, currentWatched: boolean) => void;
  onToggleLiked: (episodeNumber: number, currentLiked: boolean) => void;
  onRatingChange: (episodeNumber: number, rating: number | null) => void;
  onOpenReview: (episodeNumber: number, episodeName: string) => void;
};

export const EpisodeRow = ({
  episode,
  index,
  showInteractions,
  onToggleWatched,
  onToggleLiked,
  onRatingChange,
  onOpenReview,
}: EpisodeRowProps) => {
  const epWatched = episode.viewerInteraction?.watched ?? false;
  const epLiked = episode.viewerInteraction?.liked ?? false;
  const epRating = episode.viewerInteraction?.rating ?? null;
  const epHasReview = episode.viewerInteraction?.hasReview ?? false;

  return (
    <article
      className={`grid grid-cols-[104px_minmax(0,1fr)] gap-3 p-3 ${
        index > 0 ? "border-t" : ""
      }`}
      style={{
        borderColor: SERIAL_MODULE_STYLES.borderSoft,
        background:
          index % 2 === 0
            ? "transparent"
            : "color-mix(in srgb, var(--module-serial) 4%, transparent)",
      }}
    >
      <div
        className="relative aspect-video overflow-hidden border"
        style={{
          borderColor: SERIAL_MODULE_STYLES.borderSoft,
          background: SERIAL_MODULE_STYLES.panelSoft,
        }}
      >
        <img
          alt={episode.name}
          className="h-full w-full object-cover"
          src={getStillUrl(episode.stillPath)}
        />

        {episode.runtimeLabel ? (
          <span className="absolute bottom-1 right-1 bg-black/65 px-1.5 py-0.5 font-mono text-[9px] text-white/85">
            {episode.runtimeLabel}
          </span>
        ) : null}
      </div>

      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span
            className="font-mono text-[10px]"
            style={{ color: SERIAL_MODULE_STYLES.faint }}
          >
            {toEpisodeCodeLabel(episode.episodeNumber)}
          </span>
          <h4
            className="truncate font-mono text-xs font-bold"
            style={{ color: SERIAL_MODULE_STYLES.text }}
          >
            {episode.name}
          </h4>
        </div>

        <p
          className="line-clamp-2 text-xs leading-relaxed"
          style={{ color: SERIAL_MODULE_STYLES.muted }}
        >
          {episode.overview || "No synopsis available for this episode."}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-4">
          <p
            className="font-mono text-[10px]"
            style={{ color: SERIAL_MODULE_STYLES.faint }}
          >
            {toDateLabel(episode.airDate) ?? "Air date unknown"}
          </p>

          {showInteractions && episode.viewerInteraction && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleWatched(episode.episodeNumber, epWatched)}
                className="flex h-6 px-1.5 items-center justify-center border font-mono text-[8px] uppercase font-bold transition-all hover:bg-secondary/40"
                style={{
                  borderColor: epWatched ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.borderSoft,
                  color: epWatched ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.muted,
                  background: epWatched ? "color-mix(in srgb, var(--module-serial) 12%, transparent)" : "transparent",
                }}
                title="Mark Episode as Watched"
              >
                {epWatched ? "Watched" : "Unwatched"}
              </button>

              <button
                type="button"
                onClick={() => onToggleLiked(episode.episodeNumber, epLiked)}
                className="flex h-6 w-6 items-center justify-center border transition-all hover:bg-secondary/40"
                style={{
                  borderColor: epLiked ? "#ef4444" : SERIAL_MODULE_STYLES.borderSoft,
                  color: epLiked ? "#ef4444" : SERIAL_MODULE_STYLES.muted,
                  background: epLiked ? "rgba(239, 68, 68, 0.1)" : "transparent",
                }}
                title="Like Episode"
              >
                <Heart className="h-2.5 w-2.5" fill={epLiked ? "#ef4444" : "none"} />
              </button>

              <RatingSelect
                value={epRating}
                onChange={(val) => onRatingChange(episode.episodeNumber, val)}
                size="episode"
              />

              <button
                type="button"
                onClick={() => onOpenReview(episode.episodeNumber, episode.name)}
                className="flex h-6 px-1.5 items-center gap-1 border font-mono text-[8px] uppercase font-bold transition-all hover:bg-secondary/40"
                style={{
                  borderColor: epHasReview ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.borderSoft,
                  color: epHasReview ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.muted,
                  background: epHasReview ? "color-mix(in srgb, var(--module-serial) 12%, transparent)" : "transparent",
                }}
                title="Review Episode"
              >
                <MessageSquare className="h-2 w-2" />
                <span>{epHasReview ? "Edit Review" : "Review"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
