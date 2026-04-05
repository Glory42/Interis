import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Spinner } from "@/components/ui/spinner";
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
  module: "CINEMA" | "SERIAL";
  color: string;
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
      module: "CINEMA" as const,
      color: "var(--module-cinema)",
    })),
    ...serialsItems.map((item) => ({
      id: `serial-${item.tmdbId}`,
      title: item.title,
      to: "/serials/$tmdbId" as const,
      tmdbId: item.tmdbId,
      module: "SERIAL" as const,
      color: "var(--module-serial)",
    })),
  ].slice(0, 5);

  return (
    <section className="border border-border/70 p-5">
      <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.16em] text-primary">
        // TRENDING_NOW
      </p>

      {isLoading ? (
        <p className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <Spinner /> loading trends...
        </p>
      ) : null}

      {isError ? (
        <p className="font-mono text-[11px] text-destructive">could not load trends.</p>
      ) : null}

      {!isLoading && !isError && mergedEntries.length === 0 ? (
        <p className="font-mono text-[11px] text-muted-foreground">no trending titles yet.</p>
      ) : null}

      {!isLoading && !isError && mergedEntries.length > 0 ? (
        <div className="space-y-3">
          {mergedEntries.map((entry, index) => {
            const moduleStyle = {
              borderColor: `color-mix(in srgb, ${entry.color} 42%, transparent)`,
              color: entry.color,
            } satisfies CSSProperties;

            return (
              <div key={entry.id} className="flex items-center gap-3">
                <span className="w-4 font-mono text-[10px] text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    to={entry.to}
                    params={{ tmdbId: String(entry.tmdbId) }}
                    className="block truncate font-mono text-xs text-foreground/80 hover:text-foreground"
                    viewTransition
                  >
                    {entry.title}
                  </Link>
                </div>
                <span
                  className="shrink-0 border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.08em]"
                  style={moduleStyle}
                >
                  {entry.module}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};
