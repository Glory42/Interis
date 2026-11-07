import { useState } from "react";
import { CheckCheck, Heart, PenLine } from "lucide-react";
import type { SerialSeasonDetailResponse } from "@/features/serials/api";
import { getStillUrl } from "@/features/serials/components/utils";
import { SERIAL_MODULE_STYLES } from "@/features/media/styles";
import { toDateLabel, toEpisodeCodeLabel } from "@/features/serials/components/serial-detail/utils";
import { RatingSelect } from "@/features/serials/components/serial-detail/RatingSelect";
import { WatchTick } from "@/features/serials/components/serial-detail/WatchTick";
import { cn } from "@/lib/utils";

type Episode = SerialSeasonDetailResponse["episodes"][number];

type EpisodeRowProps = {
  episode: Episode;
  showInteractions: boolean;
  onToggleWatched: (episodeNumber: number, currentWatched: boolean) => void;
  onToggleLiked: (episodeNumber: number, currentLiked: boolean) => void;
  onRatingChange: (episodeNumber: number, rating: number | null) => void;
  onOpenReview: (episodeNumber: number, episodeName: string) => void;
  onMarkWatchedThrough: (episodeNumber: number) => void;
};

// A call-sheet line: tick, E04, title, runtime and air date. Actions show on hover or focus.
export const EpisodeRow = ({
  episode,
  showInteractions,
  onToggleWatched,
  onToggleLiked,
  onRatingChange,
  onOpenReview,
  onMarkWatchedThrough,
}: EpisodeRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const interaction = episode.viewerInteraction;
  const watched = interaction?.watched ?? false;
  const liked = interaction?.liked ?? false;
  const meta = [episode.runtimeLabel, toDateLabel(episode.airDate)].filter(Boolean).join(" · ");

  return (
    <article className="group/episode border-b border-[color:var(--line)] py-2 last:border-b-0">
      <div className="flex items-center gap-3">
        {showInteractions && interaction ? (
          <WatchTick label="Watched" pressed={watched} onClick={() => onToggleWatched(episode.episodeNumber, watched)} />
        ) : null}
        <img
          alt=""
          src={getStillUrl(episode.stillPath)}
          className="hidden aspect-video w-14 shrink-0 rounded-[2px] object-cover sm:block"
          loading="lazy"
        />
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((open) => !open)}
          className="flex min-w-0 flex-1 items-baseline gap-3 text-left"
        >
          <span className="mono-meta w-7 shrink-0 text-muted-foreground">{toEpisodeCodeLabel(episode.episodeNumber)}</span>
          <span className="body-s truncate text-foreground">{episode.name}</span>
        </button>

        {showInteractions && interaction ? (
          <div
            className={cn(
              "flex shrink-0 items-center gap-3 opacity-0 transition-opacity",
              "group-hover/episode:opacity-100 group-focus-within/episode:opacity-100 [@media(hover:none)]:opacity-100",
            )}
          >
            {watched ? null : (
              <button
                type="button"
                onClick={() => onMarkWatchedThrough(episode.episodeNumber)}
                className="mono-meta inline-flex items-center gap-1 uppercase"
                style={{ color: SERIAL_MODULE_STYLES.accent }}
              >
                <CheckCheck aria-hidden className="size-3" />
                Mark up to here
              </button>
            )}
            <RatingSelect
              value={interaction.rating}
              onChange={(rating) => onRatingChange(episode.episodeNumber, rating)}
              size="episode"
            />
            <button
              type="button"
              aria-label="Like"
              aria-pressed={liked}
              onClick={() => onToggleLiked(episode.episodeNumber, liked)}
              className={liked ? "text-[color:var(--like)]" : "text-muted-foreground hover:text-foreground"}
            >
              <Heart aria-hidden className="size-3.5" fill={liked ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={() => onOpenReview(episode.episodeNumber, episode.name)}
              className="mono-meta inline-flex items-center gap-1 uppercase"
              style={{ color: interaction.hasReview ? SERIAL_MODULE_STYLES.accent : "var(--muted-foreground)" }}
            >
              <PenLine aria-hidden className="size-3" />
              Review
            </button>
          </div>
        ) : null}

        {meta ? <span className="mono-meta hidden shrink-0 uppercase text-muted-foreground md:inline">{meta}</span> : null}
      </div>

      {isExpanded ? (
        <p className="body-s mt-2 pl-8 text-muted-foreground sm:pl-[104px]">
          {episode.overview || "No synopsis for this episode yet."}
        </p>
      ) : null}
    </article>
  );
};
