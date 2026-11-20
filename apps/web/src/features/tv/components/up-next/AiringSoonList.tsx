import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { AiringSoonEpisode, UpNextResponse } from "@/features/tv/api";
import { getPosterUrl } from "@/features/media/tmdb-images";
import { SERIES_MODULE_STYLES } from "@/features/media/styles";
import { cn } from "@/lib/utils";
import { airDayLabel, airDayParts, episodeCode } from "./up-next-format";

const AiringSoonRow = memo(function AiringSoonRow({ entry }: { entry: AiringSoonEpisode }) {
  const { series, episode } = entry;
  return (
    <li className="flex items-center gap-3">
      <img
        src={getPosterUrl(series.posterPath)}
        alt=""
        loading="lazy"
        className="aspect-2/3 w-10 shrink-0 rounded-[2px] bg-[color:var(--card)] object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to="/serials/$tmdbId"
            params={{ tmdbId: String(series.tmdbId) }}
            className="truncate text-sm font-semibold text-foreground hover:underline"
            viewTransition
          >
            {series.title}
          </Link>
          {entry.source === "watchlist" ? (
            <span className="mono-meta shrink-0 rounded-[2px] border border-[color:var(--line)] px-1 py-px text-[9px] uppercase text-muted-foreground">
              Watchlist
            </span>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          <span className="mono-meta" style={{ color: SERIES_MODULE_STYLES.accent }}>
            {episodeCode(episode)}
          </span>
          {` · ${episode.name}`}
        </p>
      </div>
    </li>
  );
});

type AiringSoonListProps = Pick<UpNextResponse, "airingSoon" | "today">;

// A timeline of the next two weeks: a date block per air day, its episodes beside the rail.
export const AiringSoonList = ({ airingSoon, today }: AiringSoonListProps) => (
  <ol>
    {airingSoon.map((group, index) => {
      const parts = airDayParts(group.date, today);
      const isLast = index === airingSoon.length - 1;
      return (
        <li key={group.date} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3">
          <div aria-hidden className="pt-0.5 text-center">
            <p className="mono-meta text-[10px] uppercase text-muted-foreground">{parts.weekday}</p>
            <p
              className="font-display text-2xl leading-none font-bold text-foreground"
              style={parts.isSoon ? { color: SERIES_MODULE_STYLES.accent } : undefined}
            >
              {parts.day}
            </p>
            <p className="mono-meta text-[10px] uppercase text-muted-foreground">{parts.month}</p>
          </div>
          <section
            aria-label={airDayLabel(group.date, today)}
            className={cn("relative border-l border-[color:var(--line)] pl-4", isLast ? "pb-1" : "pb-6")}
          >
            <span
              aria-hidden
              className="absolute top-1.5 -left-[5px] size-[9px] rounded-full border-2"
              style={{
                borderColor: parts.isSoon ? SERIES_MODULE_STYLES.accent : "var(--line-strong)",
                background: parts.isSoon ? SERIES_MODULE_STYLES.accent : "var(--bg)",
              }}
            />
            <h3 className="kicker mb-2.5" style={{ color: parts.isSoon ? SERIES_MODULE_STYLES.accent : undefined }}>
              <span className={parts.isSoon ? undefined : "text-muted-foreground"}>{parts.relative}</span>
            </h3>
            <ul className="flex flex-col gap-3">
              {group.episodes.map((entry) => (
                <AiringSoonRow
                  key={`${entry.series.tmdbId}:${entry.episode.seasonNumber}:${entry.episode.episodeNumber}`}
                  entry={entry}
                />
              ))}
            </ul>
          </section>
        </li>
      );
    })}
  </ol>
);
