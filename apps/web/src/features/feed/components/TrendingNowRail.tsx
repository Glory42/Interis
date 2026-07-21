import { Link } from "@tanstack/react-router";
import { getPosterUrl } from "@/features/films/components/utils";
import type { TrendingMovie } from "@/features/feed/types";
import type { TrendingSeries } from "@/features/serials/api";

type TrendingNowRailProps = {
  cinemaIsLoading: boolean;
  cinemaIsError: boolean;
  cinemaItems: TrendingMovie[];
  serialsIsLoading: boolean;
  serialsIsError: boolean;
  serialsItems: TrendingSeries[];
};

type RailEntry = {
  id: string;
  title: string;
  to: "/cinema/$tmdbId" | "/serials/$tmdbId";
  tmdbId: number;
  posterPath: string | null;
  color: string;
  module: "CINEMA" | "SERIAL";
};

export const TrendingNowRail = ({
  cinemaIsLoading,
  cinemaIsError,
  cinemaItems,
  serialsIsLoading,
  serialsIsError,
  serialsItems,
}: TrendingNowRailProps) => {
  const isLoading = cinemaIsLoading || serialsIsLoading;
  const isError = cinemaIsError && serialsIsError;

  const mergedEntries: RailEntry[] = [
    ...cinemaItems.map((item) => ({
      id: `cinema-${item.tmdbId}`,
      title: item.title,
      to: "/cinema/$tmdbId" as const,
      tmdbId: item.tmdbId,
      posterPath: item.posterPath,
      color: "var(--module-cinema)",
      module: "CINEMA" as const,
    })),
    ...serialsItems.map((item) => ({
      id: `serial-${item.tmdbId}`,
      title: item.title,
      to: "/serials/$tmdbId" as const,
      tmdbId: item.tmdbId,
      posterPath: item.posterPath,
      color: "var(--module-serial)",
      module: "SERIAL" as const,
    })),
  ].slice(0, 6);

  return (
    <section className="border border-border/50 bg-card/30 p-5">
      <p className="theme-kicker mb-4 text-[9px] text-primary">Trending now</p>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-11 w-8 shrink-0 bg-muted/40" />
              <div className="h-3 flex-1 bg-muted/30" />
            </div>
          ))}
        </div>
      ) : null}

      {isError ? (
        <p className="text-xs text-destructive">Could not load trends.</p>
      ) : null}

      {!isLoading && !isError && mergedEntries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No trending titles yet.</p>
      ) : null}

      {!isLoading && !isError && mergedEntries.length > 0 ? (
        <div className="space-y-3">
          {mergedEntries.map((entry) => (
            <Link
              key={entry.id}
              to={entry.to}
              params={{ tmdbId: String(entry.tmdbId) }}
              className="group -mx-2 flex items-center gap-3 border border-transparent px-2 py-1 transition-colors hover:border-border/60"
              viewTransition
            >
              {entry.posterPath ? (
                <img
                  src={getPosterUrl(entry.posterPath)}
                  alt=""
                  loading="lazy"
                  className="h-11 w-8 shrink-0 object-cover"
                />
              ) : (
                <span
                  className="h-11 w-8 shrink-0 bg-muted/40"
                  style={{ borderLeft: `2px solid ${entry.color}` }}
                />
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-foreground/85 group-hover:text-foreground">
                {entry.title}
              </span>
              <span
                className="theme-kicker shrink-0 border px-1.5 py-0.5 text-[8px]"
                style={{ borderColor: entry.color, color: entry.color }}
              >
                {entry.module}
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
};
