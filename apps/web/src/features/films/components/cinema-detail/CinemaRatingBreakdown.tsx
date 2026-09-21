import { Star } from "lucide-react";
import type { MovieDetailResponse } from "@/features/films/api";
import { formatRatingLabel } from "@/lib/rating";
import { CINEMA_MODULE_STYLES } from "@/features/films/components/cinema-detail/styles";

type CinemaRatingBreakdownProps = {
  buckets: MovieDetailResponse["ratingBreakdown"]["buckets"];
};

export const CinemaRatingBreakdown = ({ buckets }: CinemaRatingBreakdownProps) => {
  return (
    <section className="mt-8">
      <h2
        className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em]"
        style={{ color: CINEMA_MODULE_STYLES.faint }}
      >
        Rating Breakdown
      </h2>

      <div className="space-y-2">
        {buckets.map((bucket) => (
          <div
            key={`cinema-breakdown-${bucket.ratingValue}`}
            className="flex items-center gap-2"
          >
            <div className="flex w-12 shrink-0 items-center justify-end gap-1">
              <span
                className="font-mono text-[10px]"
                style={{ color: CINEMA_MODULE_STYLES.faint }}
              >
                {formatRatingLabel(bucket.ratingValue)}
              </span>
              <Star className="h-2.5 w-2.5" style={{ color: CINEMA_MODULE_STYLES.faint }} />
            </div>

            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{ background: CINEMA_MODULE_STYLES.panelSoft }}
            >
              <div
                className="h-full"
                style={{
                  width: `${bucket.percentage}%`,
                  background: CINEMA_MODULE_STYLES.accent,
                }}
              />
            </div>

            <span
              className="w-8 shrink-0 text-right font-mono text-[10px]"
              style={{ color: CINEMA_MODULE_STYLES.faint }}
            >
              {bucket.percentage}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
