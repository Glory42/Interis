import { ChevronDown, ChevronUp, Heart, MessageSquare } from "lucide-react";
import type { SerialDetailResponse } from "@/features/serials/api";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";
import { toYearFromDateLabel } from "@/features/serials/components/serial-detail/utils";
import { RatingSelect } from "@/features/serials/components/serial-detail/RatingSelect";

type Season = SerialDetailResponse["series"]["seasons"][number];

type SeasonHeaderRowProps = {
  season: Season;
  isOpen: boolean;
  showInteractions: boolean;
  onToggle: () => void;
  onToggleWatched: () => void;
  onToggleLiked: () => void;
  onRatingChange: (rating: number | null) => void;
  onOpenReview: () => void;
};

export const SeasonHeaderRow = ({
  season,
  isOpen,
  showInteractions,
  onToggle,
  onToggleWatched,
  onToggleLiked,
  onRatingChange,
  onOpenReview,
}: SeasonHeaderRowProps) => {
  const seasonWatched = season.viewerInteraction?.watched ?? false;
  const seasonLiked = season.viewerInteraction?.liked ?? false;
  const seasonRating = season.viewerInteraction?.rating ?? null;
  const seasonHasReview = season.viewerInteraction?.hasReview ?? false;

  return (
    <button
      type="button"
      className="flex w-full items-center justify-between px-4 py-3 text-left"
      onClick={onToggle}
    >
      <div className="flex flex-1 flex-wrap items-center justify-between gap-3 mr-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center"
            style={{ background: SERIAL_MODULE_STYLES.panelStrong }}
          >
            <span
              className="font-mono text-[11px]"
              style={{ color: SERIAL_MODULE_STYLES.accent }}
            >
              {season.seasonNumber}
            </span>
          </div>

          <div>
            <p
              className="font-mono text-xs font-bold"
              style={{ color: SERIAL_MODULE_STYLES.text }}
            >
              {season.name || `Season ${season.seasonNumber}`}
            </p>
            <p
              className="font-mono text-[10px]"
              style={{ color: SERIAL_MODULE_STYLES.muted }}
            >
              {season.episodeCount ?? "?"} episodes ·{" "}
              {toYearFromDateLabel(season.airDate)}
            </p>
          </div>
        </div>

        {showInteractions && season.viewerInteraction && (
          <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onToggleWatched}
              className="flex h-7 px-2 items-center justify-center border font-mono text-[9px] uppercase font-bold transition-all hover:bg-secondary/40"
              style={{
                borderColor: seasonWatched ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.borderSoft,
                color: seasonWatched ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.muted,
                background: seasonWatched ? "color-mix(in srgb, var(--module-serial) 12%, transparent)" : "transparent",
              }}
              title="Mark Season as Watched"
            >
              {seasonWatched ? "Watched" : "Unwatched"}
            </button>

            <button
              type="button"
              onClick={onToggleLiked}
              className="flex h-7 w-7 items-center justify-center border transition-all hover:bg-secondary/40"
              style={{
                borderColor: seasonLiked ? "#ef4444" : SERIAL_MODULE_STYLES.borderSoft,
                color: seasonLiked ? "#ef4444" : SERIAL_MODULE_STYLES.muted,
                background: seasonLiked ? "rgba(239, 68, 68, 0.1)" : "transparent",
              }}
              title="Like Season"
            >
              <Heart className="h-3 w-3" fill={seasonLiked ? "#ef4444" : "none"} />
            </button>

            <RatingSelect value={seasonRating} onChange={onRatingChange} size="season" />

            <button
              type="button"
              onClick={onOpenReview}
              className="flex h-7 px-2 items-center gap-1 border font-mono text-[9px] uppercase font-bold transition-all hover:bg-secondary/40"
              style={{
                borderColor: seasonHasReview ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.borderSoft,
                color: seasonHasReview ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.muted,
                background: seasonHasReview ? "color-mix(in srgb, var(--module-serial) 12%, transparent)" : "transparent",
              }}
              title="Review Season"
            >
              <MessageSquare className="h-2.5 w-2.5" />
              <span>{seasonHasReview ? "Edit Review" : "Review"}</span>
            </button>
          </div>
        )}
      </div>

      {isOpen ? (
        <ChevronUp className="h-4 w-4" style={{ color: SERIAL_MODULE_STYLES.accent }} />
      ) : (
        <ChevronDown className="h-4 w-4" style={{ color: SERIAL_MODULE_STYLES.accent }} />
      )}
    </button>
  );
};
