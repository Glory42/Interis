import { Check } from "lucide-react";
import type { UpNextItem } from "@/features/tv/api";
import { useUpdateEpisodeInteraction } from "@/features/tv/hooks/useTv";
import { SERIES_MODULE_STYLES } from "@/features/media/styles";
import { cn } from "@/lib/utils";
import { episodeCode } from "./up-next-format";

type MarkWatchedButtonProps = {
  item: UpNextItem;
  // Just the check on phones, where a row has no room for the label.
  iconOnlyOnMobile?: boolean;
  className?: string;
};

// The one tap after an episode ends; the Up next refetch brings in the following episode.
export const MarkWatchedButton = ({ item, iconOnlyOnMobile = false, className }: MarkWatchedButtonProps) => {
  const { series, episode } = item;
  const markWatched = useUpdateEpisodeInteraction(series.tmdbId, episode.seasonNumber);
  return (
    <button
      type="button"
      aria-label={`Mark ${series.title} ${episodeCode(episode)} watched`}
      disabled={markWatched.isPending}
      onClick={() => markWatched.mutate({ episodeNumber: episode.episodeNumber, input: { watched: true } })}
      className={cn(
        "flex min-h-11 items-center justify-center gap-2 rounded-[3px] text-sm font-semibold transition-opacity disabled:opacity-60",
        className,
      )}
      style={{ background: SERIES_MODULE_STYLES.accent, color: "var(--bg)" }}
    >
      <Check aria-hidden className="size-4" />
      <span className={iconOnlyOnMobile ? "hidden sm:inline" : undefined}>
        {markWatched.isPending ? "Marking…" : "Mark watched"}
      </span>
    </button>
  );
};
