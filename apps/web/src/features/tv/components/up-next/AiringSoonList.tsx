import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { AiringSoonEpisode, UpNextResponse } from "@/features/tv/api";
import { getPosterUrl } from "@/features/media/tmdb-images";
import { SERIES_MODULE_STYLES } from "@/features/media/styles";
import { airDayLabel, episodeCode } from "./up-next-format";

const AiringSoonRow = memo(function AiringSoonRow({ entry }: { entry: AiringSoonEpisode }) {
  const { series, episode } = entry;
  return (
    <li className="flex items-center gap-3 border-b border-[color:var(--line)] py-2.5 last:border-b-0">
      <img src={getPosterUrl(series.posterPath)} alt="" loading="lazy" className="aspect-2/3 w-9 shrink-0 rounded-[2px] object-cover" />
      <div className="min-w-0 flex-1">
        <Link
          to="/serials/$tmdbId"
          params={{ tmdbId: String(series.tmdbId) }}
          className="block truncate text-sm font-semibold text-foreground hover:underline"
          viewTransition
        >
          {series.title}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          <span className="mono-meta" style={{ color: SERIES_MODULE_STYLES.accent }}>
            {episodeCode(episode)}
          </span>{" "}
          {episode.name}
        </p>
      </div>
      {entry.source === "watchlist" ? (
        <span className="mono-meta shrink-0 rounded-[2px] border border-[color:var(--line)] px-1.5 py-0.5 uppercase text-muted-foreground">
          Watchlist
        </span>
      ) : null}
    </li>
  );
});

type AiringSoonListProps = Pick<UpNextResponse, "airingSoon" | "today">;

// Episodes of shows you watch or want to, by the day they air.
export const AiringSoonList = ({ airingSoon, today }: AiringSoonListProps) => (
  <div className="flex flex-col gap-5">
    {airingSoon.map((group) => (
      <section key={group.date} aria-label={airDayLabel(group.date, today)}>
        <h3 className="kicker mb-1 text-muted-foreground">{airDayLabel(group.date, today)}</h3>
        <ul>
          {group.episodes.map((entry) => (
            <AiringSoonRow
              key={`${entry.series.tmdbId}:${entry.episode.seasonNumber}:${entry.episode.episodeNumber}`}
              entry={entry}
            />
          ))}
        </ul>
      </section>
    ))}
  </div>
);
