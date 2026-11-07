import { Check } from "lucide-react";
import { SERIES_MODULE_STYLES } from "@/features/media/styles";

type NextUpCardProps = {
  seasonNumber: number;
  episodeNumber: number;
  seasonName: string;
  seasonEpisodeCount: number | null;
  onMarkWatched: () => void;
  isSaving: boolean;
};

const pad = (value: number) => String(value).padStart(2, "0");

// Phones, while you're mid-series: the one tap you make right after an episode ends.
export const NextUpCard = ({
  seasonNumber,
  episodeNumber,
  seasonName,
  seasonEpisodeCount,
  onMarkWatched,
  isSaving,
}: NextUpCardProps) => (
  <div
    className="rounded-[3px] border p-3"
    style={{ borderColor: SERIES_MODULE_STYLES.border, background: SERIES_MODULE_STYLES.panelSoft }}
  >
    <p className="kicker" style={{ color: SERIES_MODULE_STYLES.accent }}>
      {`Next up · S${pad(seasonNumber)} · E${pad(episodeNumber)}`}
    </p>
    <p className="mt-1 text-sm text-foreground">{seasonName}</p>
    <p className="mono-meta uppercase text-muted-foreground">
      {seasonEpisodeCount ? `Episode ${episodeNumber} of ${seasonEpisodeCount}` : `Episode ${episodeNumber}`}
    </p>
    <button
      type="button"
      disabled={isSaving}
      onClick={onMarkWatched}
      className="mt-2.5 flex min-h-11 w-full items-center justify-center gap-2 rounded-[3px] text-sm font-semibold disabled:opacity-60"
      style={{ background: SERIES_MODULE_STYLES.accent, color: "var(--bg)" }}
    >
      <Check aria-hidden className="size-4" />
      Mark watched
    </button>
  </div>
);
