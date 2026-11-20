import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { UpNextItem } from "@/features/tv/api";
import { SERIES_MODULE_STYLES } from "@/features/media/styles";
import { cn } from "@/lib/utils";
import { episodeKicker, stillFor } from "./up-next-format";
import { MarkWatchedButton } from "./MarkWatchedButton";

type UpNextCardProps = {
  item: UpNextItem;
  // The home strip's narrower card: no progress line.
  compact?: boolean;
  className?: string;
};

// One show's next episode with the one tap you make right after it ends.
export const UpNextCard = memo(function UpNextCard({ item, compact = false, className }: UpNextCardProps) {
  const { series, episode } = item;
  const progress = item.numberOfEpisodes ? `${item.watchedEpisodesCount}/${item.numberOfEpisodes} ep` : null;

  return (
    <article
      className={cn("flex flex-col overflow-hidden rounded-[3px] border", className)}
      style={{ borderColor: SERIES_MODULE_STYLES.border, background: SERIES_MODULE_STYLES.panel }}
    >
      <Link
        to="/serials/$tmdbId/season/$seasonNumber"
        params={{ tmdbId: String(series.tmdbId), seasonNumber: String(episode.seasonNumber) }}
        className="relative block aspect-video bg-[color:var(--card)]"
        viewTransition
      >
        <img src={stillFor(item)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        <span aria-hidden className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
        {item.newEpisodesCount > 0 ? (
          <span
            className="mono-meta absolute top-2 right-2 rounded-[2px] px-1.5 py-0.5 uppercase"
            style={{ background: SERIES_MODULE_STYLES.accent, color: "var(--bg)" }}
          >
            {`${item.newEpisodesCount} new`}
          </span>
        ) : null}
        <span className="absolute inset-x-3 bottom-2 min-w-0">
          <span className="kicker block" style={{ color: SERIES_MODULE_STYLES.accent }}>
            {episodeKicker(episode)}
          </span>
          <span className={cn("display-4 block truncate text-foreground", compact && "text-base")}>{episode.name}</span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="flex min-w-0 items-baseline justify-between gap-2">
          <Link
            to="/serials/$tmdbId"
            params={{ tmdbId: String(series.tmdbId) }}
            className="truncate text-sm font-semibold text-foreground hover:underline"
            viewTransition
          >
            {series.title}
          </Link>
          {progress && !compact ? <span className="mono-meta shrink-0 uppercase text-muted-foreground">{progress}</span> : null}
        </div>
        <MarkWatchedButton item={item} className="mt-auto w-full" />
      </div>
    </article>
  );
});
