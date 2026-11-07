import { Check, CheckCheck, Heart, PenLine } from "lucide-react";
import type { SerialSeasonDetailResponse } from "@/features/serials/api";
import { ModalShell } from "@/components/ui/ModalShell";
import { getStillUrl } from "@/features/serials/components/utils";
import { SERIAL_MODULE_STYLES } from "@/features/media/styles";
import { toDateLabel } from "@/features/serials/components/serial-detail/utils";
import { RatingSelect } from "@/features/serials/components/serial-detail/RatingSelect";
import { cn } from "@/lib/utils";

type Episode = SerialSeasonDetailResponse["episodes"][number];

export type EpisodeActions = {
  onToggleWatched: (episodeNumber: number, currentWatched: boolean) => void;
  onToggleLiked: (episodeNumber: number, currentLiked: boolean) => void;
  onRatingChange: (episodeNumber: number, rating: number | null) => void;
  onOpenReview: (episodeNumber: number, episodeName: string) => void;
  onMarkWatchedThrough: (episodeNumber: number) => void;
};

type EpisodeSheetProps = EpisodeActions & {
  episode: Episode;
  onClose: () => void;
};

const pad = (value: number) => String(value).padStart(2, "0");

const sheetButton =
  "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground";

// Phones: everything you can do to one episode, under its still.
export const EpisodeSheet = ({
  episode,
  onClose,
  onToggleWatched,
  onToggleLiked,
  onRatingChange,
  onOpenReview,
  onMarkWatchedThrough,
}: EpisodeSheetProps) => {
  const watched = episode.viewerInteraction?.watched ?? false;
  const liked = episode.viewerInteraction?.liked ?? false;
  const kicker = [
    `S${pad(episode.seasonNumber)}`,
    `E${pad(episode.episodeNumber)}`,
    episode.runtimeLabel,
    toDateLabel(episode.airDate),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ModalShell layout="sheet" onClose={onClose} ariaCloseLabel="Close episode">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={episode.name}
        className="w-full overflow-hidden rounded-t-xl border-t bg-card pb-[calc(env(safe-area-inset-bottom)+1rem)] animate-fade-up sm:max-w-md sm:rounded-md sm:border"
        style={{ borderColor: SERIAL_MODULE_STYLES.border }}
      >
        <div className="relative h-32 bg-cover bg-center" style={{ backgroundImage: `url(${getStillUrl(episode.stillPath)})` }}>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div aria-hidden className="absolute inset-x-0 top-2 mx-auto h-1 w-9 rounded-full bg-white/50" />
          <div className="absolute inset-x-4 bottom-2">
            <p className="kicker" style={{ color: SERIAL_MODULE_STYLES.accent }}>
              {kicker}
            </p>
            <p className="display-4 truncate text-white">{episode.name}</p>
          </div>
        </div>

        <div className="space-y-3 px-4 pt-3">
          <button
            type="button"
            aria-pressed={watched}
            onClick={() => onToggleWatched(episode.episodeNumber, watched)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[3px] text-sm font-semibold"
            style={
              watched
                ? { border: `1px solid ${SERIAL_MODULE_STYLES.accent}`, color: SERIAL_MODULE_STYLES.accent }
                : { background: SERIAL_MODULE_STYLES.accent, color: "var(--bg)" }
            }
          >
            <Check aria-hidden className="size-4" />
            Mark watched
          </button>

          <div>
            <p className="kicker mb-1 text-muted-foreground">Your rating</p>
            <RatingSelect
              value={episode.viewerInteraction?.rating ?? null}
              onChange={(rating) => onRatingChange(episode.episodeNumber, rating)}
              size="episode"
              fullWidth
            />
          </div>

          <div className="flex divide-x divide-[color:var(--line)] rounded-[3px] border border-[color:var(--line)]">
            <button
              type="button"
              aria-pressed={liked}
              onClick={() => onToggleLiked(episode.episodeNumber, liked)}
              className={cn(sheetButton, liked && "text-[color:var(--like)]")}
            >
              <Heart aria-hidden className="size-4" fill={liked ? "currentColor" : "none"} />
              Like
            </button>
            <button type="button" onClick={() => onOpenReview(episode.episodeNumber, episode.name)} className={sheetButton}>
              <PenLine aria-hidden className="size-4" />
              Review
            </button>
            <button
              type="button"
              onClick={() => onMarkWatchedThrough(episode.episodeNumber)}
              className={sheetButton}
              style={{ color: SERIAL_MODULE_STYLES.accent }}
            >
              <CheckCheck aria-hidden className="size-4" />
              Up to here
            </button>
          </div>
        </div>
      </section>
    </ModalShell>
  );
};
