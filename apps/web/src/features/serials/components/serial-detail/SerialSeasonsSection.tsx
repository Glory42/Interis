import type { SerialDetailResponse } from "@/features/serials/api";
import { SeasonAccordionItem } from "@/features/serials/components/serial-detail/SeasonAccordionItem";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";

type SerialSeasonsSectionProps = {
  tmdbId: number;
  seasons: SerialDetailResponse["series"]["seasons"];
  resolvedOpenSeasonNumber: number | null;
  onToggleSeason: (seasonNumber: number) => void;
};

export const SerialSeasonsSection = ({
  tmdbId,
  seasons,
  resolvedOpenSeasonNumber,
  onToggleSeason,
}: SerialSeasonsSectionProps) => {
  return (
    <section className="mt-10">
      <div
        className="mb-5 border-b pb-4"
        style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft }}
      >
        <h2
          className="font-mono text-lg font-bold"
          style={{ color: SERIAL_MODULE_STYLES.text }}
        >
          Seasons & Episodes
        </h2>
        <p
          className="mt-1 font-mono text-[10px]"
          style={{ color: SERIAL_MODULE_STYLES.faint }}
        >
          Expand a season to browse episode details.
        </p>
      </div>

      {seasons.length === 0 ? (
        <div
          className="border p-4 font-mono text-xs"
          style={{
            borderColor: SERIAL_MODULE_STYLES.border,
            color: SERIAL_MODULE_STYLES.muted,
            background: SERIAL_MODULE_STYLES.panel,
          }}
        >
          No season metadata available.
        </div>
      ) : (
        <div className="space-y-3">
          {seasons.map((season) => (
            <SeasonAccordionItem
              key={`season-${season.id}`}
              tmdbId={tmdbId}
              season={season}
              isOpen={resolvedOpenSeasonNumber === season.seasonNumber}
              onToggle={() => onToggleSeason(season.seasonNumber)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
