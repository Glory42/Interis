import { Link } from "@tanstack/react-router";
import { BookText, ChevronRight, Star } from "lucide-react";
import type { SerialArchiveItem } from "@/features/serials/api";
import { getPosterUrl } from "@/features/serials/components/utils";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-archive/constants";
import type { ArchiveRatingSource } from "@/features/serials/components/serial-archive/types";
import {
  getCreatorYearLine,
  getRatingOutOfFive,
  getRoundedStars,
} from "@/features/serials/components/serial-archive/utils";
import { cn } from "@/lib/utils";

type ListSeriesRowProps = {
  series: SerialArchiveItem;
  rank: number;
  ratingSource: ArchiveRatingSource;
};

export const ListSeriesRow = ({
  series,
  rank,
  ratingSource,
}: ListSeriesRowProps) => {
  const ratingOutOfFive = getRatingOutOfFive(series, ratingSource);
  const roundedStars = getRoundedStars(ratingOutOfFive);

  return (
    <Link
      to="/serials/$tmdbId"
      params={{ tmdbId: String(series.tmdbId) }}
      className="group flex items-center gap-3 border px-3 py-3 transition-colors"
      style={{
        borderColor: SERIAL_MODULE_STYLES.border,
        background: SERIAL_MODULE_STYLES.panel,
      }}
      viewTransition
    >
      <span
        className="w-6 shrink-0 text-right font-mono text-[10px]"
        style={{ color: SERIAL_MODULE_STYLES.faint }}
      >
        {rank}
      </span>

      <img
        src={getPosterUrl(series.posterPath)}
        alt={`${series.title} poster`}
        className="h-14 w-10 shrink-0 object-cover"
        loading="lazy"
      />

      <div className="min-w-0 flex-1">
        <h3
          className="line-clamp-1 font-mono text-xs font-bold"
          style={{ color: SERIAL_MODULE_STYLES.text }}
        >
          {series.title}
        </h3>
        <p
          className="line-clamp-1 font-mono text-[10px]"
          style={{ color: SERIAL_MODULE_STYLES.muted }}
        >
          {getCreatorYearLine(series)}
        </p>
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <span
          className="inline-flex items-center gap-0.5"
          style={{ color: SERIAL_MODULE_STYLES.accent }}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={`serial-archive-list-star-${series.tmdbId}-${index}`}
              className={cn(
                "h-2.5 w-2.5",
                index < roundedStars ? "fill-current" : "opacity-35",
              )}
            />
          ))}
        </span>
        <span className="font-mono text-[10px]" style={{ color: SERIAL_MODULE_STYLES.faint }}>
          {ratingOutOfFive !== null
            ? ratingSource === "tmdb"
              ? `TMDB ${ratingOutOfFive.toFixed(1)}`
              : ratingOutOfFive.toFixed(1)
            : "No rating"}
        </span>
      </div>

      <span
        className="inline-flex items-center gap-1 font-mono text-[10px]"
        style={{ color: SERIAL_MODULE_STYLES.faint }}
      >
        <BookText className="h-3 w-3" />
        {series.logCount.toLocaleString()}
      </span>

      <ChevronRight className="h-3.5 w-3.5" style={{ color: SERIAL_MODULE_STYLES.faint }} />
    </Link>
  );
};
