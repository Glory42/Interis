import { Link } from "@tanstack/react-router";
import { getPosterUrl } from "@/features/movies/components/utils";
import type { TrendingMovie } from "@/features/feed/types";
import type { TrendingSeries } from "@/features/serials/api";

type TrendingNowRailProps = {
  movieIsLoading: boolean;
  movieIsError: boolean;
  movieItems: TrendingMovie[];
  serialsIsLoading: boolean;
  serialsIsError: boolean;
  serialsItems: TrendingSeries[];
};

type RailEntry = {
  id: string;
  title: string;
  to: "/movies/$tmdbId" | "/serials/$tmdbId";
  tmdbId: number;
  posterPath: string | null;
};

const RAIL_LENGTH = 6;

const TrendingListSkeleton = () => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: RAIL_LENGTH }).map((_, i) => (
      <div key={i} className="flex items-center gap-2.5">
        <div className="h-9 w-7 shrink-0 rounded-md bg-muted/40" />
        <div className="h-3 flex-1 rounded bg-muted/30" />
      </div>
    ))}
  </div>
);

const TrendingListRows = ({
  entries,
  accentColor,
}: {
  entries: RailEntry[];
  accentColor: string;
}) => (
  <div>
    {entries.map((entry) => (
      <Link
        key={entry.id}
        to={entry.to}
        params={{ tmdbId: String(entry.tmdbId) }}
        className="group -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-foreground/[0.04]"
        viewTransition
      >
        {entry.posterPath ? (
          <img
            src={getPosterUrl(entry.posterPath)}
            alt=""
            loading="lazy"
            className="h-9 w-7 shrink-0 rounded-md object-cover"
          />
        ) : (
          <span
            className="h-9 w-7 shrink-0 rounded-md bg-muted/40"
            style={{ borderLeft: `2px solid ${accentColor}` }}
          />
        )}
        <span className="min-w-0 flex-1 truncate text-sm text-foreground/85 group-hover:text-foreground">
          {entry.title}
        </span>
      </Link>
    ))}
  </div>
);

type TrendingSectionProps = {
  label: string;
  accentColor: string;
  isLoading: boolean;
  isError: boolean;
  entries: RailEntry[];
  emptyLabel: string;
};

const TrendingSection = ({
  label,
  accentColor,
  isLoading,
  isError,
  entries,
  emptyLabel,
}: TrendingSectionProps) => (
  <section className="surface-card p-3">
    <p className="theme-kicker text-[9px]" style={{ color: accentColor }}>
      {label}
    </p>

    <div className="mt-2">
      {isLoading ? <TrendingListSkeleton /> : null}
      {!isLoading && isError ? (
        <p className="text-xs text-destructive">Could not load trends.</p>
      ) : null}
      {!isLoading && !isError && entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyLabel}</p>
      ) : null}
      {!isLoading && !isError && entries.length > 0 ? (
        <TrendingListRows entries={entries} accentColor={accentColor} />
      ) : null}
    </div>
  </section>
);

export const TrendingNowRail = ({
  movieIsLoading,
  movieIsError,
  movieItems,
  serialsIsLoading,
  serialsIsError,
  serialsItems,
}: TrendingNowRailProps) => {
  const movieEntries: RailEntry[] = movieItems.slice(0, RAIL_LENGTH).map((item) => ({
    id: `movie-${item.tmdbId}`,
    title: item.title,
    to: "/movies/$tmdbId",
    tmdbId: item.tmdbId,
    posterPath: item.posterPath,
  }));

  const showEntries: RailEntry[] = serialsItems.slice(0, RAIL_LENGTH).map((item) => ({
    id: `serial-${item.tmdbId}`,
    title: item.title,
    to: "/serials/$tmdbId",
    tmdbId: item.tmdbId,
    posterPath: item.posterPath,
  }));

  return (
    <div className="space-y-3">
      <TrendingSection
        label="Trending movies"
        accentColor="var(--module-movie)"
        isLoading={movieIsLoading}
        isError={movieIsError}
        entries={movieEntries}
        emptyLabel="No trending movies yet."
      />
      <TrendingSection
        label="Trending shows"
        accentColor="var(--module-serial)"
        isLoading={serialsIsLoading}
        isError={serialsIsError}
        entries={showEntries}
        emptyLabel="No trending shows yet."
      />
    </div>
  );
};
