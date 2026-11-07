import { LineRowsSkeleton, LoadingRegion } from "@/components/ui/PageSkeletons";
import { Skeleton } from "@/components/ui/Skeleton";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { SeasonAccordionItem } from "@/features/serials/components/serial-detail/SeasonAccordionItem";
import { useSeriesDetailView } from "@/features/serials/hooks/useSerials";
import { SERIAL_MODULE_STYLES } from "@/features/media/styles";

type SerialSeasonPageProps = {
  tmdbId: number;
  seasonNumber: number;
};

// One season on its own screen: back to Seasons, the reel, then every episode.
export const SerialSeasonPage = ({ tmdbId, seasonNumber }: SerialSeasonPageProps) => {
  const detailQuery = useSeriesDetailView(tmdbId, "popular");
  const season = detailQuery.data?.series.seasons.find((entry) => entry.seasonNumber === seasonNumber);
  const backLink = (
    <Link
      to="/serials/$tmdbId"
      params={{ tmdbId: String(tmdbId) }}
      hash="seasons"
      viewTransition
      className="body-s inline-flex min-h-11 items-center gap-1 text-muted-foreground"
    >
      <ChevronLeft aria-hidden className="size-4" />
      Seasons
    </Link>
  );

  if (!season) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6">
        {backLink}
        {detailQuery.isPending ? (
          <LoadingRegion label="Loading season" className="mt-4 space-y-4">
            <Skeleton className="h-24 w-full rounded-[3px]" />
            <LineRowsSkeleton count={6} withAvatar={false} />
          </LoadingRegion>
        ) : (
          <p className="body-s mt-4 text-muted-foreground">This season isn&apos;t available.</p>
        )}
      </main>
    );
  }

  const seasonName = season.name || `Season ${season.seasonNumber}`;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-10">
      <div className="sticky top-0 z-10 -mx-4 grid grid-cols-[1fr_auto_1fr] items-center border-b border-[color:var(--line)] bg-background/95 px-4 backdrop-blur-sm">
        {backLink}
        <h1 className="body-s truncate font-semibold text-foreground">
          {`${String(season.seasonNumber).padStart(2, "0")} · ${seasonName}`}
        </h1>
        {season.episodeCount ? (
          <span className="mono-meta justify-self-end" style={{ color: SERIAL_MODULE_STYLES.accent }}>
            {`${season.watchedEpisodeCount}/${season.episodeCount}`}
          </span>
        ) : (
          <span />
        )}
      </div>
      <p className="kicker mt-3 text-muted-foreground">{detailQuery.data?.series.title}</p>
      <SeasonAccordionItem tmdbId={tmdbId} season={season} variant="screen" isOpen onToggle={() => {}} />
    </main>
  );
};
