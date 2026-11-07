import type { SerialDetailResponse, SerialDetailViewerTracking } from "@/features/serials/api";
import { SeasonAccordionItem } from "@/features/serials/components/serial-detail/SeasonAccordionItem";
import { SeasonsHeading } from "@/features/serials/components/serial-detail/SeasonsHeading";

type SerialSeasonsSectionProps = {
  series: Pick<SerialDetailResponse["series"], "tmdbId" | "seasons" | "numberOfEpisodes">;
  tracking: SerialDetailViewerTracking | null;
  resolvedOpenSeasonNumber: number | null;
  onToggleSeason: (seasonNumber: number) => void;
};

export const SerialSeasonsSection = ({
  series,
  tracking,
  resolvedOpenSeasonNumber,
  onToggleSeason,
}: SerialSeasonsSectionProps) => (
  <section className="mt-10">
    <SeasonsHeading
      watchedEpisodes={tracking?.watchedEpisodesCount ?? 0}
      totalEpisodes={series.numberOfEpisodes}
      nextUp={tracking?.currentEpisode ?? null}
    />

    {series.seasons.length === 0 ? (
      <p className="body-s py-4 text-muted-foreground">No season details yet.</p>
    ) : (
      <div className="divide-y divide-[color:var(--line)]">
        {series.seasons.map((season) => (
          <SeasonAccordionItem
            key={`season-${season.id}`}
            tmdbId={series.tmdbId}
            season={season}
            isOpen={resolvedOpenSeasonNumber === season.seasonNumber}
            onToggle={() => onToggleSeason(season.seasonNumber)}
          />
        ))}
      </div>
    )}
  </section>
);
