import { useNavigate } from "@tanstack/react-router";
import type { SerialDetailResponse, SerialDetailViewerTracking } from "@/features/serials/api";
import { SeasonAccordionItem } from "@/features/serials/components/serial-detail/SeasonAccordionItem";
import { SeasonsHeading } from "@/features/serials/components/serial-detail/SeasonsHeading";
import { NextUpCard } from "@/features/serials/components/serial-detail/NextUpCard";
import { useUpdateEpisodeInteraction } from "@/features/serials/hooks/useSerials";
import { BELOW_MD_QUERY, useMediaQuery } from "@/lib/use-media-query";

type Series = Pick<SerialDetailResponse["series"], "tmdbId" | "seasons" | "numberOfEpisodes">;

type SerialSeasonsSectionProps = {
  series: Series;
  tracking: SerialDetailViewerTracking | null;
  resolvedOpenSeasonNumber: number | null;
  onToggleSeason: (seasonNumber: number) => void;
};

const NextUp = ({ series, nextUp }: { series: Series; nextUp: NonNullable<SerialDetailViewerTracking["currentEpisode"]> }) => {
  const markWatched = useUpdateEpisodeInteraction(series.tmdbId, nextUp.seasonNumber);
  const season = series.seasons.find((entry) => entry.seasonNumber === nextUp.seasonNumber);

  return (
    <NextUpCard
      seasonNumber={nextUp.seasonNumber}
      episodeNumber={nextUp.episodeNumber}
      seasonName={season?.name || `Season ${nextUp.seasonNumber}`}
      seasonEpisodeCount={season?.episodeCount ?? null}
      isSaving={markWatched.isPending}
      onMarkWatched={() => markWatched.mutate({ episodeNumber: nextUp.episodeNumber, input: { watched: true } })}
    />
  );
};

// Desktop expands seasons in place; phones open each season on its own screen (D3).
export const SerialSeasonsSection = ({
  series,
  tracking,
  resolvedOpenSeasonNumber,
  onToggleSeason,
}: SerialSeasonsSectionProps) => {
  const isPhone = useMediaQuery(BELOW_MD_QUERY);
  const navigate = useNavigate();
  const nextUp = tracking?.currentEpisode ?? null;
  const isMidSeries = Boolean(nextUp) && (tracking?.watchedEpisodesCount ?? 0) > 0;

  return (
    <section id="seasons" className="mt-10 scroll-mt-20">
      <SeasonsHeading
        watchedEpisodes={tracking?.watchedEpisodesCount ?? 0}
        totalEpisodes={series.numberOfEpisodes}
        nextUp={nextUp}
      />

      {isPhone && nextUp && isMidSeries ? (
        <div className="mt-3">
          <NextUp series={series} nextUp={nextUp} />
        </div>
      ) : null}

      {series.seasons.length === 0 ? (
        <p className="body-s py-4 text-muted-foreground">No season details yet.</p>
      ) : (
        <div className="divide-y divide-[color:var(--line)]">
          {series.seasons.map((season) => (
            <SeasonAccordionItem
              key={`season-${season.id}`}
              tmdbId={series.tmdbId}
              season={season}
              variant={isPhone ? "compact" : "accordion"}
              isOpen={resolvedOpenSeasonNumber === season.seasonNumber}
              onToggle={() =>
                isPhone
                  ? void navigate({
                      to: "/serials/$tmdbId/season/$seasonNumber",
                      params: { tmdbId: String(series.tmdbId), seasonNumber: String(season.seasonNumber) },
                      viewTransition: true,
                    })
                  : onToggleSeason(season.seasonNumber)
              }
            />
          ))}
        </div>
      )}
    </section>
  );
};
