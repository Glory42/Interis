import { Link } from "@tanstack/react-router";
import { Award } from "lucide-react";
import type { SerialArchiveItem } from "@/features/serials/api";
import { getPosterUrl } from "@/features/serials/components/utils";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-archive/constants";
import type { ArchiveRatingSource } from "@/features/serials/components/serial-archive/types";
import {
  getCreatorYearLine,
  getRatingOutOfFive,
  getSeriesStateLabel,
} from "@/features/serials/components/serial-archive/utils";

type GridSeriesCardProps = {
  series: SerialArchiveItem;
  ratingSource: ArchiveRatingSource;
};

export const GridSeriesCard = ({
  series,
  ratingSource,
}: GridSeriesCardProps) => {
  const ratingOutOfFive = getRatingOutOfFive(series, ratingSource);
  const stateLabel = getSeriesStateLabel(series);

  return (
    <Link
      to="/serials/$tmdbId"
      params={{ tmdbId: String(series.tmdbId) }}
      className="block w-full text-left"
      viewTransition
    >
      <div
        className="relative mb-3 aspect-2/3 overflow-hidden border transition-colors"
        style={{
          borderColor: SERIAL_MODULE_STYLES.border,
          background: SERIAL_MODULE_STYLES.panel,
        }}
      >
        {series.posterPath ? (
          <img
            src={getPosterUrl(series.posterPath)}
            alt={`${series.title} poster`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2"
            style={{ background: SERIAL_MODULE_STYLES.panelSoft }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center"
              style={{ background: SERIAL_MODULE_STYLES.panelStrong }}
            >
              <Award
                className="h-4 w-4"
                style={{ color: SERIAL_MODULE_STYLES.accent }}
              />
            </div>
            <span
              className="font-mono text-[8px] uppercase tracking-[0.22em]"
              style={{ color: SERIAL_MODULE_STYLES.faint }}
            >
              No Art
            </span>
          </div>
        )}

        {stateLabel ? (
          <div className="absolute right-2 top-2">
            <span
              className="border px-2 py-0.5 font-mono text-[9px] tracking-[0.16em]"
              style={{
                borderColor: SERIAL_MODULE_STYLES.accent,
                color: SERIAL_MODULE_STYLES.accent,
                background: SERIAL_MODULE_STYLES.badge,
              }}
            >
              {stateLabel}
            </span>
          </div>
        ) : null}

        {ratingOutOfFive !== null ? (
          <div className="absolute bottom-2 right-2">
            <span
              className="border px-2 py-0.5 font-mono text-[9px]"
              style={{
                borderColor: SERIAL_MODULE_STYLES.accent,
                color: SERIAL_MODULE_STYLES.accent,
                background: SERIAL_MODULE_STYLES.badge,
              }}
            >
              {ratingSource === "tmdb"
                ? `TMDB ${ratingOutOfFive.toFixed(1)}`
                : ratingOutOfFive.toFixed(1)}
            </span>
          </div>
        ) : null}
      </div>

      <p
        className="truncate font-mono text-[11px] leading-tight"
        style={{ color: SERIAL_MODULE_STYLES.text }}
      >
        {series.title}
      </p>
      <p
        className="truncate font-mono text-[10px]"
        style={{ color: SERIAL_MODULE_STYLES.muted }}
      >
        {getCreatorYearLine(series)}
      </p>
    </Link>
  );
};
