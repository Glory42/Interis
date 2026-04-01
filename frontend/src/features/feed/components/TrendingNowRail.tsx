import { Link } from "@tanstack/react-router";
import { ChevronRight, Star } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { getPosterUrl } from "@/features/films/components/utils";
import type { TrendingMovie } from "@/features/feed/types";
import type { TrendingSeries } from "@/features/serials/api";
import { getPosterUrl as getSerialPosterUrl } from "@/features/serials/components/utils";

type TrendingNowRailProps = {
  cinemaIsLoading: boolean;
  cinemaIsError: boolean;
  cinemaItems: TrendingMovie[];
  serialsIsLoading: boolean;
  serialsIsError: boolean;
  serialsItems: TrendingSeries[];
};

export const TrendingNowRail = ({
  cinemaIsLoading,
  cinemaIsError,
  cinemaItems,
  serialsIsLoading,
  serialsIsError,
  serialsItems,
}: TrendingNowRailProps) => {
  const visibleCinemaItems = cinemaItems.slice(0, 4);
  const visibleSerialItems = serialsItems.slice(0, 4);

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        <Star className="h-2.75 w-2.75 text-primary" />
        Trending Now
      </h3>

      <div className="space-y-2">
        <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Cinema
        </p>

        {cinemaIsLoading ? (
          <p className="flex items-center gap-2 px-1 py-2 text-sm text-muted-foreground">
            <Spinner /> Loading trending cinema...
          </p>
        ) : null}

        {cinemaIsError ? (
          <p className="px-1 py-2 text-sm text-destructive">Could not load cinema titles.</p>
        ) : null}

        {!cinemaIsLoading && !cinemaIsError && visibleCinemaItems.length === 0 ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">No cinema titles yet.</p>
        ) : null}

        {!cinemaIsLoading && !cinemaIsError && visibleCinemaItems.length > 0 ? (
          <div className="space-y-1">
            {visibleCinemaItems.map((item) => (
              <Link
                key={`trending-cinema-${item.tmdbId}`}
                to="/cinema/$tmdbId"
                params={{ tmdbId: String(item.tmdbId) }}
                className="group flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/45"
                viewTransition
              >
                <img
                  src={getPosterUrl(item.posterPath)}
                  alt={`${item.title} poster`}
                  className="h-12 w-9 rounded-lg object-cover opacity-75 transition-all group-hover:opacity-100"
                  loading="lazy"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.releaseYear ?? "Year unknown"}
                  </p>
                </div>

                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Serials
        </p>

        {serialsIsLoading ? (
          <p className="flex items-center gap-2 px-1 py-2 text-sm text-muted-foreground">
            <Spinner /> Loading trending serials...
          </p>
        ) : null}

        {serialsIsError ? (
          <p className="px-1 py-2 text-sm text-destructive">Could not load serial titles.</p>
        ) : null}

        {!serialsIsLoading && !serialsIsError && visibleSerialItems.length === 0 ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">No serial titles yet.</p>
        ) : null}

        {!serialsIsLoading && !serialsIsError && visibleSerialItems.length > 0 ? (
          <div className="space-y-1">
            {visibleSerialItems.map((item) => (
              <Link
                key={`trending-serial-${item.tmdbId}`}
                to="/serials/$tmdbId"
                params={{ tmdbId: String(item.tmdbId) }}
                className="group flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/45"
                viewTransition
              >
                <img
                  src={getSerialPosterUrl(item.posterPath)}
                  alt={`${item.title} poster`}
                  className="h-12 w-9 rounded-lg object-cover opacity-75 transition-all group-hover:opacity-100"
                  loading="lazy"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.firstAirYear ?? "Year unknown"}
                  </p>
                </div>

                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};
