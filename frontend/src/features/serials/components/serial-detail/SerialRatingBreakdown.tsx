import { Star } from "lucide-react";
import type { SerialDetailResponse } from "@/features/serials/api";
import { formatRatingOutOfFiveLabel } from "@/features/films/components/spaceRating.utils";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";

type SerialRatingBreakdownProps = {
  buckets: SerialDetailResponse["ratingBreakdown"]["buckets"];
};

export const SerialRatingBreakdown = ({ buckets }: SerialRatingBreakdownProps) => {
  return (
    <section className="mt-8">
      <h2
        className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em]"
        style={{ color: SERIAL_MODULE_STYLES.faint }}
      >
        Rating Breakdown
      </h2>

      <div className="space-y-2">
        {buckets.map((bucket) => (
          <div
            key={`serial-breakdown-${bucket.ratingValueOutOfFive}`}
            className="flex items-center gap-2"
          >
            <div className="flex w-12 shrink-0 items-center justify-end gap-1">
              <span
                className="font-mono text-[10px]"
                style={{ color: SERIAL_MODULE_STYLES.faint }}
              >
                {formatRatingOutOfFiveLabel(bucket.ratingValueOutOfFive)}
              </span>
              <Star className="h-2.5 w-2.5" style={{ color: SERIAL_MODULE_STYLES.faint }} />
            </div>

            <div
              className="h-1.5 flex-1 overflow-hidden"
              style={{ background: SERIAL_MODULE_STYLES.panelSoft }}
            >
              <div
                className="h-full"
                style={{
                  width: `${bucket.percentage}%`,
                  background: SERIAL_MODULE_STYLES.accent,
                }}
              />
            </div>

            <span
              className="w-8 shrink-0 text-right font-mono text-[10px]"
              style={{ color: SERIAL_MODULE_STYLES.faint }}
            >
              {bucket.percentage}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
