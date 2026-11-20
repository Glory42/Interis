import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { UpNextItem } from "@/features/tv/api";
import { SERIES_MODULE_STYLES } from "@/features/media/styles";
import { episodeKicker, stillFor } from "./up-next-format";
import { MarkWatchedButton } from "./MarkWatchedButton";

// A wide Up next row: the Up next page's list, and Home's when one or two shows would leave a strip looking empty.
export const UpNextRow = memo(function UpNextRow({ item }: { item: UpNextItem }) {
  const { series, episode } = item;
  const progress = item.numberOfEpisodes ? `${item.watchedEpisodesCount}/${item.numberOfEpisodes} ep` : null;
  const percent = item.numberOfEpisodes ? Math.min(100, (item.watchedEpisodesCount / item.numberOfEpisodes) * 100) : null;

  return (
    <article
      className="flex overflow-hidden rounded-[3px] border"
      style={{ borderColor: SERIES_MODULE_STYLES.border, background: SERIES_MODULE_STYLES.panel }}
    >
      <Link
        to="/serials/$tmdbId/season/$seasonNumber"
        params={{ tmdbId: String(series.tmdbId), seasonNumber: String(episode.seasonNumber) }}
        className="relative block w-28 shrink-0 bg-[color:var(--card)] sm:w-48"
        viewTransition
      >
        <span aria-hidden className="block aspect-video" />
        <img src={stillFor(item)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        {item.newEpisodesCount > 0 ? (
          <span
            className="mono-meta absolute top-1.5 left-1.5 rounded-[2px] px-1.5 py-0.5 uppercase"
            style={{ background: SERIES_MODULE_STYLES.accent, color: "var(--bg)" }}
          >
            {`${item.newEpisodesCount} new`}
          </span>
        ) : null}
        {percent !== null ? (
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-background/70">
            <span className="block h-full" style={{ width: `${percent}%`, background: SERIES_MODULE_STYLES.accent }} />
          </span>
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 items-center gap-3 p-2.5 sm:gap-4 sm:p-3">
        <div className="min-w-0 flex-1">
          <p className="kicker truncate" style={{ color: SERIES_MODULE_STYLES.accent }}>
            {episodeKicker(episode)}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-foreground sm:text-base">{episode.name}</p>
          <p className="mt-0.5 flex min-w-0 items-baseline gap-2">
            <Link
              to="/serials/$tmdbId"
              params={{ tmdbId: String(series.tmdbId) }}
              className="truncate text-sm text-muted-foreground hover:text-foreground hover:underline"
              viewTransition
            >
              {series.title}
            </Link>
            {progress ? <span className="mono-meta shrink-0 uppercase text-muted-foreground">{progress}</span> : null}
          </p>
        </div>
        <MarkWatchedButton item={item} iconOnlyOnMobile className="size-11 shrink-0 sm:size-auto sm:min-h-11 sm:px-4" />
      </div>
    </article>
  );
});
