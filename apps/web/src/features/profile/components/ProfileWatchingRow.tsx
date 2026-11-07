import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { ReelCells } from "@/components/film/ReelCells";
import { useUpdateEpisodeInteraction } from "@/features/serials/hooks/useSerials";
import type { CurrentlyWatchingSeries } from "@/features/profile/api/schemas";
import { getPosterUrl } from "@/features/media/tmdb-images";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (value: number) => String(value).padStart(2, "0");

const toLastWatched = (value: string, now: Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear() === now.getFullYear() ? "" : ` ${date.getFullYear()}`;
  return `last watched ${WEEKDAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${date.getDate()}${year}`;
};

const MarkNextButton = ({ tmdbId, next }: { tmdbId: number; next: NonNullable<CurrentlyWatchingSeries["currentEpisode"]> }) => {
  const markWatched = useUpdateEpisodeInteraction(tmdbId, next.seasonNumber);
  const code = `S${pad(next.seasonNumber)}E${pad(next.episodeNumber)}`;
  return (
    <button
      type="button"
      aria-label={`Mark ${code} watched`}
      disabled={markWatched.isPending}
      onClick={() => markWatched.mutate({ episodeNumber: next.episodeNumber, input: { watched: true } })}
      className="mono-meta shrink-0 rounded-[3px] border border-[color:var(--line)] px-2.5 py-1.5 text-[color:var(--series)] hover:border-[color:var(--series)] disabled:opacity-50"
    >
      {`✓ ${code}`}
    </button>
  );
};

type ProfileWatchingRowProps = {
  series: CurrentlyWatchingSeries;
  isOwner: boolean;
  now?: Date;
};

// One show in progress: next up first, then a reel of watched episodes.
export const ProfileWatchingRow = memo(function ProfileWatchingRow({ series, isOwner, now }: ProfileWatchingRowProps) {
  const next = series.currentEpisode;
  const total = series.numberOfEpisodes;
  const lastWatched = toLastWatched(series.lastWatchedAt, now ?? new Date());
  const progress = total ? `${series.watchedEpisodesCount}/${total} ep` : `${series.watchedEpisodesCount} episodes watched`;

  return (
    <article className="flex items-start gap-3.5 border-b border-[color:var(--line)] py-3 last:border-b-0">
      <img src={getPosterUrl(series.posterPath)} alt="" className="aspect-2/3 w-10 shrink-0 rounded-[2px] object-cover" loading="lazy" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <Link to="/serials/$tmdbId" params={{ tmdbId: String(series.tmdbId) }} className="truncate text-sm font-semibold text-foreground hover:underline" viewTransition>
            {series.title}
          </Link>
          {next ? (
            <span className="mono-meta shrink-0 uppercase text-[color:var(--series)]">
              {`Next up · S${pad(next.seasonNumber)}E${pad(next.episodeNumber)}`}
            </span>
          ) : null}
        </div>
        <p className="mono-meta uppercase text-muted-foreground">{[progress, lastWatched].filter(Boolean).join(" · ")}</p>
        {total ? <ReelCells total={total} watched={series.watchedEpisodesCount} className="mt-1.5" /> : null}
      </div>
      {isOwner && next ? <MarkNextButton tmdbId={series.tmdbId} next={next} /> : null}
    </article>
  );
});
