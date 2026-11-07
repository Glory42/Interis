import { ChevronDown, ChevronRight, Heart, PenLine } from "lucide-react";
import type { SerialDetailResponse } from "@/features/serials/api";
import { OutlinedRank } from "@/components/film/OutlinedRank";
import { ReelCells } from "@/components/film/ReelCells";
import { SERIAL_MODULE_STYLES } from "@/features/media/styles";
import { RatingSelect } from "@/features/serials/components/serial-detail/RatingSelect";
import { WatchTick } from "@/features/serials/components/serial-detail/WatchTick";
import { cn } from "@/lib/utils";

type Season = SerialDetailResponse["series"]["seasons"][number];

type SeasonHeaderRowProps = {
  season: Season;
  isOpen: boolean;
  showInteractions: boolean;
  // Phones: progress only; the row opens the season's own screen.
  compact?: boolean;
  onToggle: () => void;
  onToggleWatched: () => void;
  onToggleLiked: () => void;
  onRatingChange: (rating: number | null) => void;
  onOpenReview: () => void;
};

// One season = one reel: number, size, your score, and a cell per episode filled as you watch.
export const SeasonHeaderRow = ({
  season,
  isOpen,
  showInteractions: showInteractionsProp,
  compact = false,
  onToggle,
  onToggleWatched,
  onToggleLiked,
  onRatingChange,
  onOpenReview,
}: SeasonHeaderRowProps) => {
  const interaction = season.viewerInteraction;
  const showInteractions = showInteractionsProp && !compact;
  const seasonName = season.name || `Season ${season.seasonNumber}`;
  const episodeCount = season.episodeCount ?? 0;
  const meta = [season.episodeCount !== null ? `${season.episodeCount} EP` : null, season.airDate?.slice(0, 4)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="py-3">
      <div className="flex items-center gap-3">
        {showInteractions && interaction ? (
          <WatchTick label="Season watched" pressed={interaction.watched} onClick={onToggleWatched} />
        ) : null}

        <button
          type="button"
          aria-expanded={compact ? undefined : isOpen}
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <OutlinedRank value={season.seasonNumber} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">{seasonName}</span>
            {meta ? <span className="mono-meta block uppercase text-muted-foreground">{meta}</span> : null}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-3">
          {episodeCount > 0 ? (
            <span className="mono-meta" style={{ color: SERIAL_MODULE_STYLES.accent }}>
              {`${season.watchedEpisodeCount}/${episodeCount}`}
            </span>
          ) : null}

          {showInteractions && interaction ? (
            <>
              <RatingSelect value={interaction.rating} onChange={onRatingChange} size="season" />
              <button
                type="button"
                aria-label="Like season"
                aria-pressed={interaction.liked}
                onClick={onToggleLiked}
                className={cn(
                  "transition-colors",
                  interaction.liked ? "text-[color:var(--like)]" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Heart aria-hidden className="size-4" fill={interaction.liked ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                aria-label="Review season"
                onClick={onOpenReview}
                className="mono-meta inline-flex items-center gap-1 uppercase"
                style={{ color: interaction.hasReview ? SERIAL_MODULE_STYLES.accent : "var(--muted-foreground)" }}
              >
                <PenLine aria-hidden className="size-3" />
                Review
              </button>
            </>
          ) : null}

          {compact ? (
            <ChevronRight aria-hidden onClick={onToggle} className="size-4 cursor-pointer text-muted-foreground" />
          ) : (
            <ChevronDown
              aria-hidden
              onClick={onToggle}
              className={cn("size-4 cursor-pointer text-muted-foreground transition-transform", isOpen && "rotate-180")}
            />
          )}
        </div>
      </div>

      {episodeCount > 0 ? (
        <ReelCells total={episodeCount} watched={season.watchedEpisodeCount} className="mt-2 ml-[46px]" />
      ) : null}
    </div>
  );
};
