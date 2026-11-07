import { useState } from "react";
import { CheckCheck, Ellipsis, Heart, PenLine, Rocket } from "lucide-react";
import type { SerialSeasonDetailResponse } from "@/features/serials/api";
import { SERIAL_MODULE_STYLES } from "@/features/media/styles";
import { toDateLabel, toEpisodeCodeLabel } from "@/features/serials/components/serial-detail/utils";
import { RatingSelect } from "@/features/serials/components/serial-detail/RatingSelect";
import { WatchTick } from "@/features/serials/components/serial-detail/WatchTick";
import { EpisodeSheet, type EpisodeActions } from "@/features/serials/components/serial-detail/EpisodeSheet";
import { cn } from "@/lib/utils";
import { getStillUrl } from "@/features/media/tmdb-images";

type Episode = SerialSeasonDetailResponse["episodes"][number];

type EpisodeRowProps = EpisodeActions & {
  episode: Episode;
  showInteractions: boolean;
  // phone: a quieter line whose ⋯ opens the episode sheet.
  layout?: "line" | "phone";
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
  layout = "line",
}: EpisodeRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const interaction = episode.viewerInteraction;
  const watched = interaction?.watched ?? false;
  const liked = interaction?.liked ?? false;
  const meta = [episode.runtimeLabel, toDateLabel(episode.airDate)].filter(Boolean).join(" · ");
  const code = toEpisodeCodeLabel(episode.episodeNumber);

  if (layout === "phone") {
    const closeThen =
      <A extends unknown[]>(action: (...args: A) => void) =>
      (...args: A) => {
        setIsSheetOpen(false);
        action(...args);
      };

    return (
      <article className="flex items-center gap-2.5 border-b border-[color:var(--line)] py-1.5 last:border-b-0">
        {showInteractions && interaction ? (
          <WatchTick
            label="Watched"
            size="lg"
            pressed={watched}
            onClick={() => onToggleWatched(episode.episodeNumber, watched)}
          />
        ) : null}
        <img alt="" src={getStillUrl(episode.stillPath)} className="aspect-video w-16 shrink-0 rounded-[2px] object-cover" loading="lazy" />
        <div className="min-w-0 flex-1">
          <p className="body-s truncate text-foreground">
            <span className="mono-meta text-muted-foreground">{code}</span> {episode.name}
          </p>
          <p className="mono-meta truncate uppercase text-muted-foreground">
            {meta}
            {liked ? (
              <>
                {" · "}
                <span aria-label="Liked" className="text-[color:var(--like)]">♥</span>
              </>
            ) : null}
            {interaction?.rating != null ? (
              <>
                {" · "}
                <span aria-label={`Rated ${interaction.rating}`} className="text-primary">
                  <Rocket aria-hidden className="inline size-2.5 align-[-1px]" /> {interaction.rating}
                </span>
              </>
            ) : null}
          </p>
        </div>
        {showInteractions && interaction ? (
          <button
            type="button"
            aria-label={`More for ${code}`}
            onClick={() => setIsSheetOpen(true)}
            className="flex size-11 shrink-0 items-center justify-center text-muted-foreground"
          >
            <Ellipsis aria-hidden className="size-4" />
          </button>
        ) : null}
        {isSheetOpen ? (
          <EpisodeSheet
            episode={episode}
            onClose={() => setIsSheetOpen(false)}
            onToggleWatched={onToggleWatched}
            onToggleLiked={onToggleLiked}
            onRatingChange={onRatingChange}
            onOpenReview={closeThen(onOpenReview)}
            onMarkWatchedThrough={closeThen(onMarkWatchedThrough)}
          />
        ) : null}
      </article>
    );
  }

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
          <span className="mono-meta w-7 shrink-0 text-muted-foreground">{code}</span>
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
